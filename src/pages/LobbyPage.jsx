import { useState } from 'react'
import './LobbyPage.css'


const rankImages = {
  아이언: '/ranks/iron.png',
  브론즈: '/ranks/bronze.png',
  실버: '/ranks/silver.png',
  골드: '/ranks/gold.png',
  플래티넘: '/ranks/platinum.png',
  다이아몬드: '/ranks/diamond.png',
  초월자: '/ranks/ascendant.png',
  불멸: '/ranks/immortal.png',
  레디언트: '/ranks/radiant.png',
}


function LobbyPage({
  registeredUser,
  setPage,
  handleCreateRoom,
  handleJoinRoom
}) {

  const [joinRoomCode, setJoinRoomCode] =
    useState('')

  const [isJoining, setIsJoining] =
    useState(false)


  // =========================
  // 방 참가 버튼
  // =========================

  const joinRoom = async () => {

    const code =
      joinRoomCode
        .trim()
        .toUpperCase()


    if (code === '') {

      alert('방 코드를 입력해주세요.')

      return
    }


    if (code.length !== 6) {

      alert('방 코드는 6자리입니다.')

      return
    }


    if (isJoining) {

      return
    }


    setIsJoining(true)


    try {

      await handleJoinRoom(code)

    } finally {

      setIsJoining(false)
    }
  }


  return (

    <div className="lobby-page">


      {/* 방 만들기 */}

      <button
        className="create-room"
        onClick={handleCreateRoom}
      >

        <h2>
          방 만들기
        </h2>

        <p>
          새로운 경매방을 생성합니다.
        </p>

      </button>


      {/* 방 참가하기 */}

      <div className="join-room">

        <h2>
          방 참가하기
        </h2>

        <p>
          방 코드를 입력하여 경매방에 참가합니다.
        </p>


        <div className="join-room-form">

          <input
            type="text"
            placeholder="방 코드 6자리"
            maxLength={6}

            value={joinRoomCode}

            onChange={(e) =>
              setJoinRoomCode(
                e.target.value
                  .toUpperCase()
              )
            }

            onKeyDown={(e) => {

              if (
                e.key === 'Enter' &&
                !isJoining
              ) {

                joinRoom()
              }

            }}
          />


          <button
            type="button"
            onClick={joinRoom}
            disabled={isJoining}
          >

            {isJoining
              ? '확인 중...'
              : '참가하기'
            }

          </button>

        </div>

      </div>


      {/* 내 프로필 */}

      <div className="my-profile">

        <h2>
          내 프로필
        </h2>


        <div className="profile-content">


          <div className="profile-image">

            {registeredUser.profileImage ? (

              <img
                src={
                  registeredUser.profileImage
                }
                alt="프로필"
              />

            ) : (

              <span>
                ?
              </span>

            )}

          </div>


          <div className="profile-info">


            <p className="profile-nickname">
              {registeredUser.nickname}
            </p>


            <div className="rank-info">

              <span>
                최고 티어:
              </span>

              <img
                src={
                  rankImages[
                    registeredUser.highestTier
                  ]
                }
                alt={
                  registeredUser.highestTier
                }
              />

            </div>


            <div className="rank-info">

              <span>
                현재 티어:
              </span>

              <img
                src={
                  rankImages[
                    registeredUser.currentTier
                  ]
                }
                alt={
                  registeredUser.currentTier
                }
              />

            </div>


            <p>
              주 포지션: {registeredUser.mainPosition}
            </p>


            <p className="profile-message">
              "
              {registeredUser.message ||
                '아직 한마디가 없습니다.'}
              "
            </p>

          </div>

        </div>

      </div>


      {/* 프로필 설정 */}

      <button
        className="profile-setting"

        onClick={() =>
          setPage('profile-setting')
        }
      >

        <h2>
          프로필 설정
        </h2>

        <p>
          내 프로필 정보를 수정합니다.
        </p>

      </button>


    </div>
  )
}


export default LobbyPage