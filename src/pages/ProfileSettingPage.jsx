import { useState } from 'react'
import './ProfileSettingPage.css'

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

  const handleSave = () => {
    setRegisteredUser({
      ...registeredUser,
      nickname: nickname,
      message: message,
      highestTier: highestTier,
      currentTier: currentTier,
      mainPosition: mainPosition,
      profileImage: profileImage
    })

    alert('프로필이 저장되었습니다.')
    setPage('lobby')
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
                onChange={(e) => {
                  const file = e.target.files[0]

                  if (file) {
                    const imageUrl = URL.createObjectURL(file)
                    setProfileImage(imageUrl)
                  }
                }}
              />
            </label>

            <button
              type="button"
              className="profile-delete-button"
              onClick={() => setProfileImage('')}
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
        <button onClick={handleSave}>
          저장하기
        </button>

      </div>

    </div>
  )
}

export default ProfileSettingPage