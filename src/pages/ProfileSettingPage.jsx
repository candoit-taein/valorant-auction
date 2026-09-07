import { useEffect, useState } from 'react'
import './ProfileSettingPage.css'
import { supabase } from '../supabase'

function ProfileSettingPage({
  registeredUser,
  setRegisteredUser,
  setPage
}) {
  const [nickname, setNickname] = useState(registeredUser.nickname)
  const [message, setMessage] = useState(registeredUser.message || '')
  const [highestTier, setHighestTier] = useState(registeredUser.highestTier)
  const [currentTier, setCurrentTier] = useState(registeredUser.currentTier)
  const [mainPosition, setMainPosition] = useState(registeredUser.mainPosition)

  const [profileImage, setProfileImage] = useState(
    registeredUser.profileImage || ''
  )

  const [selectedImageFile, setSelectedImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])


  // =========================
  // 프로필 사진 선택
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.')
      return
    }

    // 너무 큰 파일 업로드 방지
    if (file.size > 5 * 1024 * 1024) {
      alert('프로필 사진은 5MB 이하만 업로드할 수 있습니다.')
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const nextPreviewUrl =
      URL.createObjectURL(file)

    setSelectedImageFile(file)
    setPreviewUrl(nextPreviewUrl)
    setProfileImage(nextPreviewUrl)
  }


  // =========================
  // 프로필 사진 삭제
  // =========================

  const handleDeleteImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl('')
    setSelectedImageFile(null)
    setProfileImage('')
  }


  // =========================
  // Storage 업로드
  // =========================

  const uploadProfileImage =
    async () => {

      if (!selectedImageFile) {
        // 기존 사진 유지 또는 삭제 상태
        return profileImage.startsWith('blob:')
          ? ''
          : profileImage
      }

      const {
        data: {
          user
        }
      } =
        await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인 정보를 찾을 수 없습니다.')
      }

      const extension =
        selectedImageFile.name
          .split('.')
          .pop()
          ?.toLowerCase() || 'png'

      const filePath =
        `${user.id}/${Date.now()}.${extension}`

      const {
        error: uploadError
      } =
        await supabase.storage
          .from('profile-images')
          .upload(
            filePath,
            selectedImageFile,
            {
              cacheControl: '3600',
              upsert: false
            }
          )

      if (uploadError) {
        throw uploadError
      }

      const {
        data
      } =
        supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath)

      return data.publicUrl
    }


  // =========================
  // 저장
  // =========================

  const handleSave =
    async () => {

      if (saving) {
        return
      }

      const trimmedNickname =
        nickname.trim()

      if (!trimmedNickname) {
        alert('닉네임을 입력해주세요.')
        return
      }

      setSaving(true)

      try {

        const finalProfileImage =
          await uploadProfileImage()


        // =========================
        // Supabase Auth 메타데이터 수정
        // =========================

        const {
          error: authError
        } =
          await supabase.auth.updateUser({
            data: {
              userId:
                registeredUser.userId,

              nickname:
                trimmedNickname,

              message,

              highestTier,

              currentTier,

              mainPosition,

              profileImage:
                finalProfileImage
            }
          })

        if (authError) {
          throw authError
        }


        // =========================
        // 이미 들어가 있는 모든 방 참가자 정보 수정
        // =========================

        const {
          error: participantError
        } =
          await supabase
            .from('room_participants')
            .update({
              nickname:
                trimmedNickname,

              message,

              highest_tier:
                highestTier,

              current_tier:
                currentTier,

              main_position:
                mainPosition,

              profile_image:
                finalProfileImage
            })
            .eq(
              'user_id',
              registeredUser.userId
            )

        if (participantError) {
          throw participantError
        }


        const updatedUser = {
          ...registeredUser,

          nickname:
            trimmedNickname,

          message,

          highestTier,

          currentTier,

          mainPosition,

          profileImage:
            finalProfileImage
        }

        setRegisteredUser(
          updatedUser
        )

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }

        setPreviewUrl('')
        setSelectedImageFile(null)
        setProfileImage(finalProfileImage)

        alert('프로필이 저장되었습니다.')
        setPage('lobby')

      } catch (error) {

        console.error(
          '프로필 저장 오류:',
          error
        )

        alert(
          `프로필 저장 중 오류가 발생했습니다.\n${error.message || ''}`
        )

      } finally {

        setSaving(false)
      }
    }


  return (
    <div className="profile-setting-page">

      <div className="setting-container">

        <h1>프로필 설정</h1>

        <button
          className="back-button"
          onClick={() => setPage('lobby')}
        >
          ← 로비로 돌아가기
        </button>


        {/* 프로필 사진 */}
        <label>프로필 사진</label>

        <div className="profile-image-setting">

          <div className="profile-image-preview">
            {profileImage ? (
              <img
                src={profileImage}
                alt="프로필"
              />
            ) : (
              <span>?</span>
            )}
          </div>

          <div className="profile-image-buttons">

            <label className="profile-upload-button">
              사진 변경

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>

            <button
              type="button"
              className="profile-delete-button"
              onClick={handleDeleteImage}
            >
              사진 삭제
            </button>

          </div>

        </div>


        {/* 닉네임 */}
        <label>닉네임</label>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />


        {/* 내 한마디 */}
        <label>내 한마디</label>

        <input
          className="message-input"
          type="text"
          value={message}
          maxLength={40}
          placeholder="경매에 임하는 각오를 적어주세요!"
          onChange={(e) => setMessage(e.target.value)}
        />

        <p>{message.length} / 40</p>


        {/* 최고 티어 */}
        <label>최고 티어</label>

        <select
          value={highestTier}
          onChange={(e) => setHighestTier(e.target.value)}
        >
          <option value="아이언">아이언</option>
          <option value="브론즈">브론즈</option>
          <option value="실버">실버</option>
          <option value="골드">골드</option>
          <option value="플래티넘">플래티넘</option>
          <option value="다이아몬드">다이아몬드</option>
          <option value="초월자">초월자</option>
          <option value="불멸">불멸</option>
          <option value="레디언트">레디언트</option>
        </select>


        {/* 현재 티어 */}
        <label>현재 티어</label>

        <select
          value={currentTier}
          onChange={(e) => setCurrentTier(e.target.value)}
        >
          <option value="아이언">아이언</option>
          <option value="브론즈">브론즈</option>
          <option value="실버">실버</option>
          <option value="골드">골드</option>
          <option value="플래티넘">플래티넘</option>
          <option value="다이아몬드">다이아몬드</option>
          <option value="초월자">초월자</option>
          <option value="불멸">불멸</option>
          <option value="레디언트">레디언트</option>
        </select>


        {/* 주 포지션 */}
        <label>주 포지션</label>

        <select
          value={mainPosition}
          onChange={(e) => setMainPosition(e.target.value)}
        >
          <option value="타격대">타격대</option>
          <option value="척후대">척후대</option>
          <option value="감시자">감시자</option>
          <option value="전략가">전략가</option>
        </select>


        {/* 저장 */}
        <button
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? '저장 중...'
            : '저장하기'}
        </button>

      </div>

    </div>
  )
}

export default ProfileSettingPage
