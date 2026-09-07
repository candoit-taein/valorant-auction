import {
  useEffect,
  useState
} from 'react'

import './App.css'

import LobbyPage from './pages/LobbyPage'
import ProfileSettingPage from './pages/ProfileSettingPage'
import RoomPage from './pages/RoomPage'

import { supabase } from './supabase'


function App() {

  // =========================
  // 로그인 / 회원가입
  // =========================

  const [registeredUser, setRegisteredUser] =
    useState(null)

  const [page, setPage] =
    useState('login')

  const [userId, setUserId] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [nickname, setNickname] =
    useState('')

  const [highestTier, setHighestTier] =
    useState('')

  const [currentTier, setCurrentTier] =
    useState('')

  const [mainPosition, setMainPosition] =
    useState('')


  // =========================
  // 로그인 입력
  // =========================

  const [loginId, setLoginId] =
    useState('')

  const [loginPassword, setLoginPassword] =
    useState('')


  // =========================
  // 실제 방 참가자
  // =========================

  const [
    roomParticipants,
    setRoomParticipants
  ] = useState([])


  // =========================
  // 팀
  // =========================

  const [teams, setTeams] =
    useState([
      {
        id: 1,
        name: 'TEAM 1',
        points: 1000,
        leader: null,
        players: []
      },

      {
        id: 2,
        name: 'TEAM 2',
        points: 1000,
        leader: null,
        players: []
      },

      {
        id: 3,
        name: 'TEAM 3',
        points: 1000,
        leader: null,
        players: []
      },

      {
        id: 4,
        name: 'TEAM 4',
        points: 1000,
        leader: null,
        players: []
      }
    ])


  // =========================
  // 경매 선수
  // =========================

  const [
    auctionPlayers,
    setAuctionPlayers
  ] = useState([])


  // =========================
  // 경매 상태
  // =========================

  const [
    auctionStarted,
    setAuctionStarted
  ] = useState(false)

  const [
    timeLeft,
    setTimeLeft
  ] = useState(15)

  const [
    currentBid,
    setCurrentBid
  ] = useState(0)

  const [
    highestBidTeam,
    setHighestBidTeam
  ] = useState(null)

  const [
    auctionLogs,
    setAuctionLogs
  ] = useState([])


  // =========================
  // 관리자 설정
  // =========================

  const [
    adminSettingsOpen,
    setAdminSettingsOpen
  ] = useState(false)


  // =========================
  // 관리자 여부
  // =========================

  const [
    isAdmin,
    setIsAdmin
  ] = useState(true)


  // =========================
  // 현재 입장한 방 코드
  // =========================

  const [
    roomCode,
    setRoomCode
  ] = useState('')


  // =========================
  // 6자리 방 코드 생성
  // =========================

  const generateRoomCode = () => {

    const characters =
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

    let code = ''

    for (
      let i = 0;
      i < 6;
      i++
    ) {

      const randomIndex =
        Math.floor(
          Math.random() *
          characters.length
        )

      code +=
        characters[randomIndex]
    }

    return code
  }


  // =========================
  // 참가자를 React에서
  // 사용하던 형태로 변환
  // =========================

  const convertParticipant = (
    participant
  ) => {

    return {
      id:
        participant.id,

      userId:
        participant.user_id,

      nickname:
        participant.nickname,

      highestTier:
        participant.highest_tier,

      currentTier:
        participant.current_tier,

      mainPosition:
        participant.main_position,

      message:
        participant.message || '',

      profileImage:
        participant.profile_image || ''
    }
  }


  // =========================
  // 참가자 목록 불러오기
  // =========================

  const loadRoomParticipants =
    async (code) => {

      if (!code) {
        return false
      }


      const {
        data,
        error
      } =
        await supabase
          .from('room_participants')
          .select('*')
          .eq(
            'room_code',
            code
          )
          .order(
            'created_at',
            {
              ascending: true
            }
          )


      if (error) {

        console.error(
          '참가자 목록 조회 오류:',
          error
        )

        return false
      }


      const participants =
        data.map(
          convertParticipant
        )


      setRoomParticipants(
        participants
      )

      return true
    }


  // =========================
  // 현재 유저를
  // 방 참가자로 등록
  // =========================

  const addRoomParticipant =
    async (
      code,
      user = registeredUser
    ) => {

      if (!user) {

        console.error(
          '참가자 등록 실패: 유저 정보 없음'
        )

        return false
      }


      const {
        error
      } =
        await supabase
          .from('room_participants')
          .insert([
            {
              room_code:
                code,

              user_id:
                user.userId,

              nickname:
                user.nickname,

              highest_tier:
                user.highestTier,

              current_tier:
                user.currentTier,

              main_position:
                user.mainPosition,

              message:
                user.message || '',

              profile_image:
                user.profileImage || ''
            }
          ])


      // =========================
      // 23505 =
      // 이미 참가자로 등록됨
      // =========================

      if (
        error &&
        error.code !== '23505'
      ) {

        console.error(
          '참가자 등록 오류:',
          error
        )

        alert(
          '방 참가자 등록 중 오류가 발생했습니다.'
        )

        return false
      }


      return true
    }


  // =========================
  // Realtime 참가자 감지
  // =========================

  useEffect(() => {

    if (
      page !== 'room' ||
      roomCode === ''
    ) {

      return
    }


    // 방 입장 시 한 번 조회

    loadRoomParticipants(
      roomCode
    )


    // =========================
    // room_participants 변경 감지
    // =========================

    const channel =
      supabase
        .channel(
          `room-participants-${roomCode}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',

            schema: 'public',

            table:
              'room_participants',

            filter:
              `room_code=eq.${roomCode}`
          },

          () => {

            loadRoomParticipants(
              roomCode
            )

          }
        )
        .subscribe()


    // =========================
    // 방 나가면 구독 해제
    // =========================

    return () => {

      supabase.removeChannel(
        channel
      )
    }

  }, [
    page,
    roomCode
  ])


  // =========================
  // 실제 방 만들기
  // =========================

  const handleCreateRoom =
    async () => {

      if (!registeredUser) {

        alert(
          '로그인이 필요합니다.'
        )

        return
      }


      // =========================
      // 같은 코드가 생기면
      // 최대 5번 재시도
      // =========================

      for (
        let attempt = 0;
        attempt < 5;
        attempt++
      ) {

        const newRoomCode =
          generateRoomCode()


        const {
          error
        } =
          await supabase
            .from('rooms')
            .insert([
              {
                room_code:
                  newRoomCode,

                host_user_id:
                  registeredUser.userId
              }
            ])


        // =========================
        // 방 생성 성공
        // =========================

        if (!error) {

          // =========================
          // 방장 참가자 등록
          // =========================

          const participantAdded =
            await addRoomParticipant(
              newRoomCode,
              registeredUser
            )


          if (!participantAdded) {

            alert(
              '방은 생성됐지만 참가자 등록에 실패했습니다.'
            )

            return
          }


          // =========================
          // 참가자 목록 불러오기
          // =========================

          await loadRoomParticipants(
            newRoomCode
          )


          setRoomCode(
            newRoomCode
          )

          setIsAdmin(
            true
          )

          setPage(
            'room'
          )

          return
        }


        // =========================
        // 방 코드 중복
        // =========================

        if (
          error.code === '23505'
        ) {

          continue
        }


        console.error(
          '방 생성 오류:',
          error
        )

        alert(
          '방을 만드는 중 오류가 발생했습니다.'
        )

        return
      }


      alert(
        '방 코드를 생성하지 못했습니다. 다시 시도해주세요.'
      )
    }


  // =========================
  // 실제 방 참가하기
  // =========================

  const handleJoinRoom =
    async (inputCode) => {

      if (!registeredUser) {

        alert(
          '로그인이 필요합니다.'
        )

        return false
      }


      const code =
        inputCode
          .trim()
          .toUpperCase()


      if (
        code === ''
      ) {

        alert(
          '방 코드를 입력해주세요.'
        )

        return false
      }


      if (
        code.length !== 6
      ) {

        alert(
          '방 코드는 6자리입니다.'
        )

        return false
      }


      // =========================
      // 실제 존재하는 방 검색
      // =========================

      const {
        data,
        error
      } =
        await supabase
          .from('rooms')
          .select(
            'id, room_code, host_user_id'
          )
          .eq(
            'room_code',
            code
          )
          .maybeSingle()


      if (error) {

        console.error(
          '방 조회 오류:',
          error
        )

        alert(
          '방을 찾는 중 오류가 발생했습니다.'
        )

        return false
      }


      // =========================
      // 없는 방
      // =========================

      if (!data) {

        alert(
          '존재하지 않는 방입니다.'
        )

        return false
      }


      // =========================
      // 나를 참가자로 등록
      // =========================

      const participantAdded =
        await addRoomParticipant(
          data.room_code,
          registeredUser
        )


      if (!participantAdded) {

        return false
      }


      // =========================
      // 참가자 목록 불러오기
      // =========================

      await loadRoomParticipants(
        data.room_code
      )


      // =========================
      // 현재 방 설정
      // =========================

      setRoomCode(
        data.room_code
      )


      // =========================
      // 방 만든 계정이면 관리자
      // =========================

      const joinedAsAdmin =
        data.host_user_id ===
        registeredUser.userId


      setIsAdmin(
        joinedAsAdmin
      )


      setPage(
        'room'
      )

      return true
    }


  // =========================
  // 회원가입
  // =========================

  const handleSignup = () => {

    if (
      userId === ''
    ) {

      alert(
        '아이디를 입력해주세요.'
      )

      return
    }


    if (
      password === ''
    ) {

      alert(
        '비밀번호를 입력해주세요.'
      )

      return
    }


    if (
      nickname === ''
    ) {

      alert(
        '닉네임을 입력해주세요.'
      )

      return
    }


    if (
      highestTier === ''
    ) {

      alert(
        '최고 티어를 선택해주세요.'
      )

      return
    }


    if (
      currentTier === ''
    ) {

      alert(
        '현재 티어를 선택해주세요.'
      )

      return
    }


    if (
      mainPosition === ''
    ) {

      alert(
        '주 포지션을 선택해주세요.'
      )

      return
    }


    setRegisteredUser({
      userId,
      password,
      nickname,
      highestTier,
      currentTier,
      mainPosition,

      message: '',
      profileImage: ''
    })


    alert(
      '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.'
    )

    setPage(
      'login'
    )
  }


  // =========================
  // 로그인
  // =========================

  const handleLogin = () => {

    if (
      loginId === ''
    ) {

      alert(
        '아이디를 입력해주세요.'
      )

      return
    }


    if (
      loginPassword === ''
    ) {

      alert(
        '비밀번호를 입력해주세요.'
      )

      return
    }


    if (
      registeredUser === null
    ) {

      alert(
        '가입된 계정이 없습니다. 회원가입을 먼저 해주세요.'
      )

      return
    }


    if (
      loginId !==
        registeredUser.userId ||

      loginPassword !==
        registeredUser.password
    ) {

      alert(
        '아이디 또는 비밀번호가 일치하지 않습니다.'
      )

      return
    }


    setPage(
      'lobby'
    )
  }


  return (

    <div className="login-page">


      {/* =========================
          로그인
      ========================= */}

      {page === 'login' && (

        <div className="login-box">

          <img
            src="/valorant-logo.png"
            alt="VALORANT"
            className="valorant-logo"
          />


          <h1>
            발로랜드 경매
          </h1>


          <p className="game-title">
            VALORANT
          </p>


          <div className="login-form">

            <input
              type="text"
              placeholder="아이디"

              value={
                loginId
              }

              onChange={(e) =>
                setLoginId(
                  e.target.value
                )
              }
            />


            <input
              type="password"
              placeholder="비밀번호"

              value={
                loginPassword
              }

              onChange={(e) =>
                setLoginPassword(
                  e.target.value
                )
              }
            />


            <button
              className="login-button"

              onClick={
                handleLogin
              }
            >

              로그인

            </button>

          </div>


          <button
            className="signup-button"

            onClick={() =>
              setPage(
                'signup'
              )
            }
          >

            회원가입 →

          </button>

        </div>

      )}


      {/* =========================
          회원가입
      ========================= */}

      {page === 'signup' && (

        <div className="login-box">

          <h1>
            회원가입
          </h1>


          <p className="game-title">
            VALORANT
          </p>


          <div className="login-form">

            <input
              type="text"

              placeholder=
                "사용할 아이디를 입력해주세요."

              value={
                userId
              }

              onChange={(e) =>
                setUserId(
                  e.target.value
                )
              }
            />


            <input
              type="password"

              placeholder=
                "비밀번호"

              value={
                password
              }

              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />


            <input
              type="text"

              placeholder=
                "경매에서 사용할 닉네임"

              value={
                nickname
              }

              onChange={(e) =>
                setNickname(
                  e.target.value
                )
              }
            />


            <select
              value={
                highestTier
              }

              onChange={(e) =>
                setHighestTier(
                  e.target.value
                )
              }
            >

              <option value="">
                최고 티어 선택
              </option>

              <option>
                아이언
              </option>

              <option>
                브론즈
              </option>

              <option>
                실버
              </option>

              <option>
                골드
              </option>

              <option>
                플래티넘
              </option>

              <option>
                다이아몬드
              </option>

              <option>
                초월자
              </option>

              <option>
                불멸
              </option>

              <option>
                레디언트
              </option>

            </select>


            <select
              value={
                currentTier
              }

              onChange={(e) =>
                setCurrentTier(
                  e.target.value
                )
              }
            >

              <option value="">
                현재 티어 선택
              </option>

              <option>
                아이언
              </option>

              <option>
                브론즈
              </option>

              <option>
                실버
              </option>

              <option>
                골드
              </option>

              <option>
                플래티넘
              </option>

              <option>
                다이아몬드
              </option>

              <option>
                초월자
              </option>

              <option>
                불멸
              </option>

              <option>
                레디언트
              </option>

            </select>


            <select
              value={
                mainPosition
              }

              onChange={(e) =>
                setMainPosition(
                  e.target.value
                )
              }
            >

              <option value="">
                주 포지션 선택
              </option>

              <option>
                타격대
              </option>

              <option>
                척후대
              </option>

              <option>
                감시자
              </option>

              <option>
                전략가
              </option>

            </select>


            <button
              className="login-button"

              onClick={
                handleSignup
              }
            >

              가입하기

            </button>

          </div>


          <button
            className="signup-button"

            onClick={() =>
              setPage(
                'login'
              )
            }
          >

            ← 로그인으로

          </button>

        </div>

      )}


      {/* =========================
          로비
      ========================= */}

      {page === 'lobby' && (

        <LobbyPage

          registeredUser={
            registeredUser
          }

          setPage={
            setPage
          }

          handleCreateRoom={
            handleCreateRoom
          }

          handleJoinRoom={
            handleJoinRoom
          }

        />

      )}


      {/* =========================
          프로필 설정
      ========================= */}

      {page === 'profile-setting' && (

        <ProfileSettingPage

          registeredUser={
            registeredUser
          }

          setRegisteredUser={
            setRegisteredUser
          }

          setPage={
            setPage
          }

        />

      )}


      {/* =========================
          경매방
      ========================= */}

      {page === 'room' && (

        <RoomPage

          setPage={
            setPage
          }

          registeredUser={
            registeredUser
          }

          roomCode={
            roomCode
          }

          roomParticipants={
            roomParticipants
          }

          teams={
            teams
          }

          setTeams={
            setTeams
          }

          auctionPlayers={
            auctionPlayers
          }

          setAuctionPlayers={
            setAuctionPlayers
          }

          auctionStarted={
            auctionStarted
          }

          setAuctionStarted={
            setAuctionStarted
          }

          timeLeft={
            timeLeft
          }

          setTimeLeft={
            setTimeLeft
          }

          currentBid={
            currentBid
          }

          setCurrentBid={
            setCurrentBid
          }

          highestBidTeam={
            highestBidTeam
          }

          setHighestBidTeam={
            setHighestBidTeam
          }

          auctionLogs={
            auctionLogs
          }

          setAuctionLogs={
            setAuctionLogs
          }

          adminSettingsOpen={
            adminSettingsOpen
          }

          setAdminSettingsOpen={
            setAdminSettingsOpen
          }

          isAdmin={
            isAdmin
          }

        />

      )}


      {/* =========================
          푸터
      ========================= */}

      <div className="footer-info">

        <span>
          Made by 김태인
        </span>

        <span>
          Version 0.1.0
        </span>

      </div>


    </div>
  )
}


export default App