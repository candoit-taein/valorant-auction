import { useEffect, useRef } from 'react'
import './RoomPage.css'
import { supabase } from '../supabase'


function RoomPage({
  setPage,

  registeredUser,

  roomCode,

  roomParticipants,

  teams,
  setTeams,

  auctionPlayers,
  setAuctionPlayers,

  auctionStarted,
  setAuctionStarted,

  timeLeft,
  setTimeLeft,

  currentBid,
  setCurrentBid,

  highestBidTeam,
  setHighestBidTeam,

  auctionLogs,
  setAuctionLogs,

  adminSettingsOpen,
  setAdminSettingsOpen,

  isAdmin
}) {

  // =========================
  // 현재 경매 선수
  // =========================

  const currentPlayer =
    auctionPlayers.length > 0
      ? auctionPlayers[0]
      : null


  // =========================
  // 최신 입찰값 보관
  // =========================
  // 타이머가 0이 되는 순간
  // 가장 최근 입찰값을 정확히 사용하기 위함
  // =========================

  const currentBidRef = useRef(currentBid)
  const highestBidTeamRef = useRef(highestBidTeam)

  // 입찰할 때마다 남은 시간을 늘리기 위한
  // 실제 타이머 종료 시각
  const auctionEndTimeRef = useRef(null)

  // 방장이 방을 종료했을 때
  // 같은 알림이 여러 번 뜨는 것을 방지
  const roomClosedHandledRef = useRef(false)


  useEffect(() => {
    currentBidRef.current = currentBid
  }, [currentBid])


  useEffect(() => {
    highestBidTeamRef.current = highestBidTeam
  }, [highestBidTeam])


  // =========================
  // Supabase 실시간 상태용 최신값
  // =========================

  const teamsRef = useRef(teams)
  const auctionPlayersRef = useRef(auctionPlayers)
  const auctionStartedRef = useRef(auctionStarted)
  const timeLeftRef = useRef(timeLeft)
  const auctionLogsRef = useRef(auctionLogs)


  useEffect(() => {
    teamsRef.current = teams
  }, [teams])


  useEffect(() => {
    auctionPlayersRef.current = auctionPlayers
  }, [auctionPlayers])


  useEffect(() => {
    auctionStartedRef.current = auctionStarted
  }, [auctionStarted])


  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])


  useEffect(() => {
    auctionLogsRef.current = auctionLogs
  }, [auctionLogs])


  // =========================
  // 방 상태 Supabase 저장
  // =========================

  const saveRoomState =
    async (overrides = {}) => {

      if (!roomCode) {
        return false
      }


      const payload = {
        room_code:
          roomCode,

        teams:
          overrides.teams ??
          teamsRef.current,

        auction_players:
          overrides.auctionPlayers ??
          auctionPlayersRef.current,

        auction_started:
          overrides.auctionStarted ??
          auctionStartedRef.current,

        time_left:
          overrides.timeLeft ??
          timeLeftRef.current,

        current_bid:
          overrides.currentBid ??
          currentBidRef.current,

        highest_bid_team:
          overrides.highestBidTeam ??
          highestBidTeamRef.current,

        auction_logs:
          overrides.auctionLogs ??
          auctionLogsRef.current,

        updated_at:
          new Date().toISOString()
      }


      const {
        error
      } =
        await supabase
          .from('room_states')
          .upsert(
            payload,
            {
              onConflict: 'room_code'
            }
          )


      if (error) {

        console.error(
          '경매방 상태 저장 오류:',
          error
        )

        return false
      }


      return true
    }


  // =========================
  // Supabase 상태를 화면에 적용
  // =========================

  const applyRemoteRoomState = (
    roomState
  ) => {

    if (!roomState) {
      return
    }


    // =========================
    // 방장이 방을 종료한 경우
    // 참가자 전원 로비로 이동
    // =========================

    if (
      roomState.room_closed === true
    ) {

      if (
        !roomClosedHandledRef.current
      ) {

        roomClosedHandledRef.current = true

        if (!isAdmin) {
          alert(
            '방장이 방을 종료했습니다.'
          )
        }

        setPage('lobby')
      }

      return
    }


    const nextTeams =
      Array.isArray(roomState.teams)
        ? roomState.teams
        : []

    const nextAuctionPlayers =
      Array.isArray(
        roomState.auction_players
      )
        ? roomState.auction_players
        : []

    const nextAuctionStarted =
      Boolean(
        roomState.auction_started
      )

    const nextTimeLeft =
      Number(
        roomState.time_left ?? 15
      )

    const nextCurrentBid =
      Number(
        roomState.current_bid ?? 0
      )

    const nextHighestBidTeam =
      roomState.highest_bid_team ?? null

    const nextAuctionLogs =
      Array.isArray(
        roomState.auction_logs
      )
        ? roomState.auction_logs
        : []


    teamsRef.current =
      nextTeams

    auctionPlayersRef.current =
      nextAuctionPlayers

    auctionStartedRef.current =
      nextAuctionStarted

    timeLeftRef.current =
      nextTimeLeft

    if (nextAuctionStarted) {

      auctionEndTimeRef.current =
        performance.now() +
        Math.max(
          0,
          nextTimeLeft
        ) * 1000

    } else {

      auctionEndTimeRef.current =
        null
    }

    currentBidRef.current =
      nextCurrentBid

    highestBidTeamRef.current =
      nextHighestBidTeam

    auctionLogsRef.current =
      nextAuctionLogs


    setTeams(
      nextTeams
    )

    setAuctionPlayers(
      nextAuctionPlayers
    )

    setAuctionStarted(
      nextAuctionStarted
    )

    setTimeLeft(
      nextTimeLeft
    )

    setCurrentBid(
      nextCurrentBid
    )

    setHighestBidTeam(
      nextHighestBidTeam
    )

    setAuctionLogs(
      nextAuctionLogs
    )
  }


  // =========================
  // 방 입장 시 상태 불러오기 +
  // room_states Realtime 구독
  // =========================

  useEffect(() => {

    if (!roomCode) {
      return
    }


    let cancelled = false


    const initializeRoomState =
      async () => {

        const {
          data,
          error
        } =
          await supabase
            .from('room_states')
            .select('*')
            .eq(
              'room_code',
              roomCode
            )
            .maybeSingle()


        if (cancelled) {
          return
        }


        if (error) {

          console.error(
            '경매방 상태 조회 오류:',
            error
          )

          return
        }


        if (data) {

          applyRemoteRoomState(
            data
          )

          return
        }


        // 기존 방이라 room_states 행이 없으면
        // 방장이 최초 상태를 생성
        if (isAdmin) {

          await saveRoomState({
            teams:
              teamsRef.current,

            auctionPlayers:
              auctionPlayersRef.current,

            auctionStarted:
              false,

            timeLeft:
              15,

            currentBid:
              0,

            highestBidTeam:
              null,

            auctionLogs:
              auctionLogsRef.current
          })
        }
      }


    initializeRoomState()


    const channel =
      supabase
        .channel(
          `room-state-${roomCode}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',

            schema: 'public',

            table: 'room_states',

            filter:
              `room_code=eq.${roomCode}`
          },

          (payload) => {

            if (
              payload.new &&
              payload.new.room_code ===
                roomCode
            ) {

              applyRemoteRoomState(
                payload.new
              )
            }
          }
        )
        .subscribe()


    return () => {

      cancelled = true

      supabase.removeChannel(
        channel
      )
    }

  }, [
    roomCode,
    isAdmin
  ])


  // =========================
  // 로비로 나가기
  // =========================

  const handleExitRoom =
    async () => {

      // 일반 참가자는 자기만 로비로 이동
      if (!isAdmin) {

        setPage('lobby')
        return
      }


      // 방장은 방 자체를 종료
      const confirmed =
        window.confirm(
          '방장이 나가면 이 방은 종료되고 모든 참가자가 로비로 이동합니다.\n정말 나가시겠습니까?'
        )


      if (!confirmed) {
        return
      }


      const {
        error
      } =
        await supabase
          .from('room_states')
          .update({
            room_closed: true,
            auction_started: false,
            updated_at:
              new Date().toISOString()
          })
          .eq(
            'room_code',
            roomCode
          )


      if (error) {

        console.error(
          '방 종료 오류:',
          error
        )

        alert(
          '방 종료 중 오류가 발생했습니다.'
        )

        return
      }


      roomClosedHandledRef.current = true

      setAuctionStarted(false)
      auctionStartedRef.current = false

      setPage('lobby')
    }


  // =========================
  // 활성 팀
  // 팀장이 있는 팀만 표시
  // =========================

  const activeTeams =
    teams.filter((team) => team.leader !== null)


  // =========================
  // 현재 로그인 사용자가
  // 어느 팀의 팀장인지 찾기
  // =========================

  const myLeaderTeam =
    teams.find((team) => {

      if (!team.leader) {
        return false
      }

      if (!registeredUser) {
        return false
      }

      return (
        team.leader.nickname ===
        registeredUser.nickname
      )
    })


  // =========================
  // 팀장 지정
  // =========================

  const handleLeaderChange = (
    teamId,
    participantId
  ) => {

    if (auctionStartedRef.current) {
      return
    }


    const currentTeams =
      teamsRef.current

    const numericParticipantId =
      Number(participantId)


    let nextTeams


    // 팀장 해제
    if (!participantId) {

      nextTeams =
        currentTeams.map((team) =>
          team.id === teamId
            ? {
                ...team,
                leader: null
              }
            : team
        )

    } else {

      const participant =
        roomParticipants.find(
          (user) =>
            user.id ===
            numericParticipantId
        )


      if (!participant) {
        return
      }


      const alreadyLeader =
        currentTeams.find(
          (team) =>
            team.id !== teamId &&
            team.leader?.id ===
              participant.id
        )


      if (alreadyLeader) {

        alert(
          `${participant.nickname}님은 이미 ${alreadyLeader.name} 팀장입니다.`
        )

        return
      }


      nextTeams =
        currentTeams.map((team) =>
          team.id === teamId
            ? {
                ...team,
                leader: participant
              }
            : team
        )
    }


    teamsRef.current =
      nextTeams

    setTeams(
      nextTeams
    )

    saveRoomState({
      teams: nextTeams
    })
  }


  // =========================
  // 팀 포인트 변경
  // =========================

  const handleTeamPointsChange = (
    teamId,
    value
  ) => {

    if (auctionStartedRef.current) {
      return
    }


    const points =
      Math.max(
        0,
        Number(value) || 0
      )


    const nextTeams =
      teamsRef.current.map((team) =>
        team.id === teamId
          ? {
              ...team,
              points
            }
          : team
      )


    teamsRef.current =
      nextTeams

    setTeams(
      nextTeams
    )

    saveRoomState({
      teams: nextTeams
    })
  }


  // =========================
  // 관리자 설정 완료
  //
  // 팀장은 경매 대상에서 제외
  // =========================

  const handleSaveAdminSettings = () => {

    const currentTeams =
      teamsRef.current


    const leaderIds =
      currentTeams
        .filter((team) => team.leader)
        .map((team) => team.leader.id)


    const players =
      roomParticipants.filter(
        (participant) =>
          !leaderIds.includes(
            participant.id
          )
      )


    const activeTeamCount =
      currentTeams.filter(
        (team) => team.leader !== null
      ).length


    const nextLogs = [
      ...auctionLogsRef.current,
      `관리자 설정 완료 - ${activeTeamCount}개 팀 / 경매 선수 ${players.length}명`
    ]


    auctionPlayersRef.current =
      players

    currentBidRef.current = 0
    highestBidTeamRef.current = null
    timeLeftRef.current = 15
    auctionLogsRef.current =
      nextLogs


    setAuctionPlayers(
      players
    )

    setCurrentBid(
      0
    )

    setHighestBidTeam(
      null
    )

    setTimeLeft(
      15
    )

    setAdminSettingsOpen(
      false
    )

    setAuctionLogs(
      nextLogs
    )


    saveRoomState({
      teams:
        currentTeams,

      auctionPlayers:
        players,

      auctionStarted:
        false,

      timeLeft:
        15,

      currentBid:
        0,

      highestBidTeam:
        null,

      auctionLogs:
        nextLogs
    })
  }


  // =========================
  // 선수 순서 위 / 아래
  // =========================

  const movePlayer = (
    index,
    direction
  ) => {

    if (auctionStartedRef.current) {
      return
    }


    const targetIndex =
      index + direction


    if (
      targetIndex < 0 ||
      targetIndex >=
        auctionPlayersRef.current.length
    ) {
      return
    }


    const newPlayers = [
      ...auctionPlayersRef.current
    ]


    ;[
      newPlayers[index],
      newPlayers[targetIndex]
    ] = [
      newPlayers[targetIndex],
      newPlayers[index]
    ]


    auctionPlayersRef.current =
      newPlayers

    setAuctionPlayers(
      newPlayers
    )

    saveRoomState({
      auctionPlayers:
        newPlayers
    })
  }


  // =========================
  // 랜덤 섞기
  // =========================

  const shufflePlayers = () => {

    if (auctionStartedRef.current) {
      return
    }


    const shuffled = [
      ...auctionPlayersRef.current
    ]


    for (
      let i =
        shuffled.length - 1;
      i > 0;
      i--
    ) {

      const randomIndex =
        Math.floor(
          Math.random() *
          (i + 1)
        )


      ;[
        shuffled[i],
        shuffled[randomIndex]
      ] = [
        shuffled[randomIndex],
        shuffled[i]
      ]
    }


    auctionPlayersRef.current =
      shuffled

    setAuctionPlayers(
      shuffled
    )

    saveRoomState({
      auctionPlayers:
        shuffled
    })
  }


  // =========================
  // 경매 시작
  // =========================

  const handleStartAuction = () => {

    if (!isAdmin) {
      return
    }


    const currentTeams =
      teamsRef.current

    const currentPlayers =
      auctionPlayersRef.current

    const currentActiveTeams =
      currentTeams.filter(
        (team) =>
          team.leader !== null
      )


    if (
      currentActiveTeams.length < 2
    ) {

      alert(
        '경매를 시작하려면 최소 2개의 팀에 팀장을 지정해주세요.'
      )

      return
    }


    if (
      currentPlayers.length === 0
    ) {

      alert(
        '경매 참가자가 없습니다. 관리자 설정을 먼저 완료해주세요.'
      )

      return
    }


    const nextLogs = [
      ...auctionLogsRef.current,
      `${currentPlayers[0].nickname} 경매 시작`
    ]


    setAdminSettingsOpen(
      false
    )


    currentBidRef.current = 0
    highestBidTeamRef.current = null
    timeLeftRef.current = 15
    auctionStartedRef.current = true
    auctionLogsRef.current =
      nextLogs


    setCurrentBid(
      0
    )

    setHighestBidTeam(
      null
    )

    setTimeLeft(
      15
    )

    setAuctionStarted(
      true
    )

    setAuctionLogs(
      nextLogs
    )


    saveRoomState({
      teams:
        currentTeams,

      auctionPlayers:
        currentPlayers,

      auctionStarted:
        true,

      timeLeft:
        15,

      currentBid:
        0,

      highestBidTeam:
        null,

      auctionLogs:
        nextLogs
    })
  }


  // =========================
  // 입찰
  // =========================

  const handleBid =
    async (amount) => {

      if (!auctionStartedRef.current) {
        return
      }


      if (!myLeaderTeam) {

        alert(
          '팀장만 입찰할 수 있습니다.'
        )

        return
      }


      // 다른 브라우저에서 방금 올라온
      // 입찰가까지 한 번 더 확인
      const {
        data: latestState,
        error
      } =
        await supabase
          .from('room_states')
          .select(
            'teams, auction_players, auction_started, time_left, current_bid, highest_bid_team, auction_logs'
          )
          .eq(
            'room_code',
            roomCode
          )
          .maybeSingle()


      if (error) {

        console.error(
          '최신 입찰 상태 조회 오류:',
          error
        )

        return
      }


      if (
        !latestState ||
        !latestState.auction_started
      ) {
        return
      }


      const latestTeams =
        Array.isArray(
          latestState.teams
        )
          ? latestState.teams
          : teamsRef.current


      const latestMyTeam =
        latestTeams.find(
          (team) => {

            if (!team.leader) {
              return false
            }


            if (
              team.leader.userId &&
              registeredUser?.userId
            ) {

              return (
                team.leader.userId ===
                registeredUser.userId
              )
            }


            return (
              team.leader.nickname ===
              registeredUser?.nickname
            )
          }
        )


      if (!latestMyTeam) {

        alert(
          '현재 팀장 정보가 변경되었습니다.'
        )

        return
      }


      const latestBid =
        Number(
          latestState.current_bid ?? 0
        )

      const newBid =
        latestBid + amount


      if (
        newBid >
        latestMyTeam.points
      ) {

        alert(
          `${latestMyTeam.name}의 남은 포인트가 부족합니다.`
        )

        return
      }


      const latestLogs =
        Array.isArray(
          latestState.auction_logs
        )
          ? latestState.auction_logs
          : []


      const nextLogs = [
        ...latestLogs,
        `${latestMyTeam.name} +${amount}P 입찰 → ${newBid}P`
      ]


      currentBidRef.current =
        newBid

      highestBidTeamRef.current =
        latestMyTeam.id

      auctionLogsRef.current =
        nextLogs

      teamsRef.current =
        latestTeams


      // =========================
      // 입찰할 때마다 7초 추가
      // =========================

      const currentRemaining =
        Math.max(
          0,
          Number(
            timeLeftRef.current ??
            latestState.time_left ??
            0
          )
        )

      const extendedTime =
        currentRemaining + 3

      timeLeftRef.current =
        extendedTime

      auctionEndTimeRef.current =
        performance.now() +
        extendedTime * 1000


      setTeams(
        latestTeams
      )

      setTimeLeft(
        extendedTime
      )

      setCurrentBid(
        newBid
      )

      setHighestBidTeam(
        latestMyTeam.id
      )

      setAuctionLogs(
        nextLogs
      )


      await saveRoomState({
        teams:
          latestTeams,

        auctionPlayers:
          Array.isArray(
            latestState.auction_players
          )
            ? latestState.auction_players
            : auctionPlayersRef.current,

        auctionStarted:
          true,

        timeLeft:
          extendedTime,

        currentBid:
          newBid,

        highestBidTeam:
          latestMyTeam.id,

        auctionLogs:
          nextLogs
      })
    }


  // =========================
  // 경매 종료
  // =========================

  const finishAuction = (
    player
  ) => {

    if (!player) {
      return
    }


    const finalBid =
      currentBidRef.current

    const finalTeamId =
      highestBidTeamRef.current

    const currentTeams =
      teamsRef.current

    const currentPlayers =
      auctionPlayersRef.current

    let nextTeams =
      currentTeams

    let nextPlayers =
      currentPlayers

    let nextLogs = [
      ...auctionLogsRef.current
    ]

    let nextAuctionStarted =
      true

    let nextTimeLeft =
      15


    // =========================
    // 유찰
    // =========================

    if (finalTeamId === null) {

      if (
        currentPlayers.length <= 1
      ) {

        nextPlayers = []

        nextAuctionStarted =
          false

        nextTimeLeft =
          0

        nextLogs.push(
          `${player.nickname} 유찰 - 남은 경매 선수가 없어 경매 종료`
        )

        nextLogs.push(
          '모든 선수의 경매가 종료되었습니다.'
        )

      } else {

        nextPlayers = [
          ...currentPlayers.slice(1),
          currentPlayers[0]
        ]

        nextLogs.push(
          `${player.nickname} 유찰 - 맨 뒤로 이동`
        )

        nextLogs.push(
          `${nextPlayers[0].nickname} 경매 시작`
        )
      }

    } else {

      // =========================
      // 낙찰
      // =========================

      const winningTeam =
        currentTeams.find(
          (team) =>
            team.id === finalTeamId
        )


      if (winningTeam) {

        nextTeams =
          currentTeams.map(
            (team) => {

              if (
                team.id !==
                finalTeamId
              ) {
                return team
              }


              return {
                ...team,

                points:
                  Math.max(
                    0,
                    team.points -
                    finalBid
                  ),

                players: [
                  ...team.players,
                  player
                ]
              }
            }
          )


        nextLogs.push(
          `${player.nickname} → ${winningTeam.name} ${finalBid}P 낙찰`
        )
      }


      nextPlayers =
        currentPlayers.slice(1)


      if (
        nextPlayers.length === 0
      ) {

        nextAuctionStarted =
          false

        nextTimeLeft =
          0

        nextLogs.push(
          '모든 선수의 경매가 종료되었습니다.'
        )

      } else {

        nextLogs.push(
          `${nextPlayers[0].nickname} 경매 시작`
        )
      }
    }


    teamsRef.current =
      nextTeams

    auctionPlayersRef.current =
      nextPlayers

    auctionStartedRef.current =
      nextAuctionStarted

    timeLeftRef.current =
      nextTimeLeft

    if (nextAuctionStarted) {

      auctionEndTimeRef.current =
        performance.now() +
        nextTimeLeft * 1000

    } else {

      auctionEndTimeRef.current =
        null
    }

    auctionLogsRef.current =
      nextLogs

    currentBidRef.current = 0
    highestBidTeamRef.current = null


    setTeams(
      nextTeams
    )

    setAuctionPlayers(
      nextPlayers
    )

    setAuctionStarted(
      nextAuctionStarted
    )

    setCurrentBid(
      0
    )

    setHighestBidTeam(
      null
    )

    setTimeLeft(
      nextTimeLeft
    )

    setAuctionLogs(
      nextLogs
    )


    saveRoomState({
      teams:
        nextTeams,

      auctionPlayers:
        nextPlayers,

      auctionStarted:
        nextAuctionStarted,

      timeLeft:
        nextTimeLeft,

      currentBid:
        0,

      highestBidTeam:
        null,

      auctionLogs:
        nextLogs
    })
  }


  // =========================
  // 15.00초 타이머
  // =========================
  // 각 화면은 타이머를 표시하지만
  // 실제 낙찰 처리는 방장만 수행
  // =========================

  useEffect(() => {

    if (!auctionStarted) {
      return
    }


    if (!currentPlayer) {

      setAuctionStarted(
        false
      )

      setTimeLeft(
        0
      )

      return
    }


    const playerAtStart =
      currentPlayer


    if (
      auctionEndTimeRef.current === null
    ) {

      auctionEndTimeRef.current =
        performance.now() +
        Math.max(
          0,
          Number(
            timeLeftRef.current || 15
          )
        ) * 1000
    }


    const timer =
      setInterval(() => {

        const remaining =
          Math.max(
            0,
            (
              auctionEndTimeRef.current -
              performance.now()
            ) / 1000
          )


        timeLeftRef.current =
          remaining

        setTimeLeft(
          remaining
        )


        if (remaining <= 0) {

          clearInterval(
            timer
          )


          if (isAdmin) {

            finishAuction(
              playerAtStart
            )

          } else {

            setTimeLeft(
              0
            )
          }
        }

      }, 10)


    return () => {

      clearInterval(
        timer
      )
    }

  }, [
    auctionStarted,
    currentPlayer?.id,
    isAdmin
  ])


  // =========================
  // 다음 선수 상태 확인
  // =========================

  useEffect(() => {

    if (
      auctionStarted &&
      !currentPlayer
    ) {

      setAuctionStarted(
        false
      )

      setTimeLeft(
        0
      )
    }

  }, [
    auctionStarted,
    currentPlayer?.id
  ])


  return (
    <div className="room-page">


      {/* =========================
          상단 헤더
      ========================= */}

      <div className="room-header">

        <div className="room-title">

          <h1>
            발로랜드 경매
          </h1>

          <p>
            AUCTION ROOM
          </p>

        </div>


        <div className="room-code">

          <span>
            ROOM CODE
          </span>

          <strong>
            {roomCode}
          </strong>

        </div>


        <div className="room-header-buttons">

          {isAdmin && (

            <button
              className="admin-setting-button"
              disabled={auctionStarted}
              onClick={() =>
                setAdminSettingsOpen(true)
              }
            >
              관리자 설정
            </button>

          )}


          <button
            className="room-exit"
            onClick={handleExitRoom}
          >
            로비로 나가기
          </button>

        </div>

      </div>


      {/* =========================
          관리자 설정
      ========================= */}

      {adminSettingsOpen && (

        <div className="admin-modal-overlay">

          <div className="admin-modal admin-modal-large">


            <div className="admin-modal-header">

              <div>

                <span>
                  ADMIN CONTROL
                </span>

                <h2>
                  관리자 설정
                </h2>

              </div>


              <button
                className="admin-modal-close"
                onClick={() =>
                  setAdminSettingsOpen(false)
                }
              >
                ×
              </button>

            </div>


            <p className="admin-modal-description">
              방 참가자를 팀장으로 지정하고
              팀별 시작 포인트를 설정할 수 있습니다.
            </p>


            {/* 팀 설정 */}

            <div className="admin-section-title">

              <span>01</span>

              <div>
                <strong>
                  팀 설정
                </strong>

                <small>
                  팀장이 지정된 팀만 활성화됩니다.
                </small>
              </div>

            </div>


            <div className="admin-team-settings">

              {teams.map((team) => (

                <div
                  className={`admin-team-setting ${
                    team.leader
                      ? 'active'
                      : ''
                  }`}
                  key={team.id}
                >

                  <div className="admin-team-setting-header">

                    <strong>
                      {team.name}
                    </strong>

                    <span>
                      {team.leader
                        ? 'ACTIVE'
                        : 'INACTIVE'}
                    </span>

                  </div>


                  <label>
                    팀장

                    <select
                      value={
                        team.leader?.id || ''
                      }
                      onChange={(e) =>
                        handleLeaderChange(
                          team.id,
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        팀장 선택 안 함
                      </option>


                      {roomParticipants.map(
                        (participant) => (

                          <option
                            key={participant.id}
                            value={participant.id}
                          >
                            {participant.nickname}
                          </option>

                        )
                      )}

                    </select>

                  </label>


                  <label>
                    시작 포인트

                    <input
                      type="number"
                      min="0"
                      value={team.points}
                      onChange={(e) =>
                        handleTeamPointsChange(
                          team.id,
                          e.target.value
                        )
                      }
                    />

                  </label>

                </div>

              ))}

            </div>


            {/* 경매 순서 */}

            <div className="admin-section-title admin-auction-section">

              <span>02</span>

              <div>
                <strong>
                  경매 참가자 / 순서
                </strong>

                <small>
                  팀장은 설정 완료 시 경매 대상에서 제외됩니다.
                </small>
              </div>

            </div>


            <button
              className="shuffle-button"
              onClick={shufflePlayers}
              disabled={
                auctionPlayers.length === 0
              }
            >
              🎲 랜덤 섞기
            </button>


            <div className="admin-player-list">

              {auctionPlayers.length === 0 ? (

                <div className="admin-empty-players">

                  팀장을 먼저 지정한 뒤
                  아래의 설정 완료 버튼을 눌러주세요.

                </div>

              ) : (

                auctionPlayers.map(
                  (player, index) => (

                    <div
                      className="admin-player-item"
                      key={player.id}
                    >

                      <span className="admin-order-number">
                        {index + 1}
                      </span>


                      <div className="admin-player-profile">

                        <div className="admin-player-image">

                          {player.profileImage ? (

                            <img
                              src={player.profileImage}
                              alt={player.nickname}
                            />

                          ) : (

                            <span>
                              {player.nickname.charAt(0)}
                            </span>

                          )}

                        </div>


                        <div>

                          <strong>
                            {player.nickname}
                          </strong>

                          <span>
                            {player.currentTier}
                            {' · '}
                            {player.mainPosition}
                          </span>

                        </div>

                      </div>


                      <div className="admin-order-buttons">

                        <button
                          disabled={
                            index === 0
                          }
                          onClick={() =>
                            movePlayer(
                              index,
                              -1
                            )
                          }
                        >
                          ↑
                        </button>


                        <button
                          disabled={
                            index ===
                            auctionPlayers.length - 1
                          }
                          onClick={() =>
                            movePlayer(
                              index,
                              1
                            )
                          }
                        >
                          ↓
                        </button>

                      </div>

                    </div>

                  )
                )

              )}

            </div>


            <button
              className="admin-save-button"
              onClick={
                handleSaveAdminSettings
              }
            >
              설정 완료
            </button>

          </div>

        </div>

      )}


      {/* =========================
          메인
      ========================= */}

      <div className="room-content">


        {/* =========================
            왼쪽 - 팀 현황
        ========================= */}

        <div className="team-panel">

          <div className="panel-title">

            <h2>
              팀 현황
            </h2>

            <span>
              {activeTeams.length} TEAMS
            </span>

          </div>


          {activeTeams.length === 0 ? (

            <div className="no-active-team">

              관리자가 팀장을 지정하면
              팀이 활성화됩니다.

            </div>

          ) : (

            activeTeams.map(
              (team) => {

                const teamMembers = [
                  {
                    ...team.leader,
                    isLeader: true
                  },

                  ...team.players.map(
                    (player) => ({
                      ...player,
                      isLeader: false
                    })
                  )
                ]


                return (

                  <div
                    className="team-box"
                    key={team.id}
                  >

                    <div className="team-header">

                      <div className="team-name">

                        <span className="team-number">
                          {team.id}
                        </span>

                        <h3>
                          {team.name}
                        </h3>

                      </div>


                      <div className="team-points">

                        <span>
                          남은 포인트
                        </span>

                        <strong>
                          {team.points} P
                        </strong>

                      </div>

                    </div>


                    <div className="team-slots">

                      {teamMembers.map(
                        (member) => (

                          <div
                            className={`member-slot ${
                              member.isLeader
                                ? 'leader-slot'
                                : ''
                            }`}
                            key={member.id}
                          >

                            <div className="member-image">

                              {member.profileImage ? (

                                <img
                                  src={member.profileImage}
                                  alt={member.nickname}
                                />

                              ) : (

                                <span>
                                  {member.nickname.charAt(0)}
                                </span>

                              )}

                            </div>


                            <div className="member-info">

                              {member.isLeader && (

                                <span className="leader-badge">
                                  TEAM LEADER
                                </span>

                              )}

                              <strong>
                                {member.nickname}
                              </strong>

                            </div>

                          </div>

                        )
                      )}


                      {Array.from({
                        length: Math.max(
                          0,
                          5 - teamMembers.length
                        )
                      }).map(
                        (_, index) => (

                          <div
                            className="member-slot empty-slot"
                            key={`empty-${index}`}
                          >

                            <div className="member-image empty-image">
                              ?
                            </div>

                            <div className="member-info">
                              <span>
                                EMPTY
                              </span>
                            </div>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )
              }
            )

          )}

        </div>


        {/* =========================
            가운데
        ========================= */}

        <div className="auction-center">

          <div className="auction-title">

            <span>
              LIVE AUCTION
            </span>

            <h2>
              현재 경매
            </h2>

          </div>


          {currentPlayer ? (

            <>

              <div className="current-player-card">

                <div className="current-player-image">

                  {currentPlayer.profileImage ? (

                    <img
                      src={currentPlayer.profileImage}
                      alt={currentPlayer.nickname}
                    />

                  ) : (

                    <span>
                      {currentPlayer.nickname.charAt(0)}
                    </span>

                  )}

                </div>


                <div className="current-player-info">

                  <span className="player-status">
                    현재 경매 선수
                  </span>

                  <h2>
                    {currentPlayer.nickname}
                  </h2>

                  <p>
                    {currentPlayer.currentTier}
                    {' · '}
                    {currentPlayer.mainPosition}
                  </p>

                </div>

              </div>


              <div className="bid-status">

                <div className="bid-info-box">

                  <span>
                    최고 입찰 팀
                  </span>

                  <strong>
                    {
                      teams.find(
                        (team) =>
                          team.id ===
                          highestBidTeam
                      )?.name || '-'
                    }
                  </strong>

                </div>


                <div className="bid-info-box">

                  <span>
                    현재 입찰가
                  </span>

                  <div>

                    <strong className="bid-price">
                      {currentBid}
                    </strong>

                    <small>
                      P
                    </small>

                  </div>

                </div>

              </div>


              <div
                className={`auction-timer ${
                  timeLeft <= 5 &&
                  auctionStarted
                    ? 'timer-danger'
                    : ''
                }`}
              >

                <span>
                  남은 시간
                </span>

                <strong>
                  {Number(timeLeft).toFixed(2)}
                </strong>

              </div>


              <div className="auction-state">

                {auctionStarted
                  ? '경매 진행중'
                  : '경매 대기중'}

              </div>


              {isAdmin &&
                !auctionStarted && (

                  <button
                    className="start-auction-button"
                    onClick={
                      handleStartAuction
                    }
                  >
                    경매 시작
                  </button>

              )}


              <div className="bid-buttons">

                <button
                  disabled={
                    !auctionStarted ||
                    !myLeaderTeam
                  }
                  onClick={() =>
                    handleBid(10)
                  }
                >
                  +10 P
                </button>


                <button
                  disabled={
                    !auctionStarted ||
                    !myLeaderTeam
                  }
                  onClick={() =>
                    handleBid(50)
                  }
                >
                  +50 P
                </button>


                <button
                  disabled={
                    !auctionStarted ||
                    !myLeaderTeam
                  }
                  onClick={() =>
                    handleBid(100)
                  }
                >
                  +100 P
                </button>

              </div>


              {myLeaderTeam ? (

                <p className="spectator-message leader-message">
                  현재 {myLeaderTeam.name} 팀장으로 입찰합니다.
                </p>

              ) : (

                <p className="spectator-message">
                  팀장만 입찰할 수 있습니다.
                </p>

              )}

            </>

          ) : (

            <div className="auction-finished">

              <h2>
                경매 준비
              </h2>

              <p>
                관리자 설정에서 팀장과
                경매 참가자를 설정해주세요.
              </p>

            </div>

          )}


          {/* 경매 로그 */}

          <div className="auction-log">

            <div className="auction-log-title">

              <h3>
                경매 로그
              </h3>

              <span>
                LIVE
              </span>

            </div>


            <div className="auction-log-content">

              {auctionLogs.length === 0 ? (

                <p className="empty-log">
                  아직 경매 기록이 없습니다.
                </p>

              ) : (

                auctionLogs
                  .slice()
                  .reverse()
                  .map(
                    (log, index) => (

                      <p
                        className="auction-log-item"
                        key={index}
                      >
                        {log}
                      </p>

                    )
                  )

              )}

            </div>

          </div>

        </div>


        {/* =========================
            오른쪽
        ========================= */}

        <div className="auction-right">


          {currentPlayer && (

            <div className="player-profile">

              <div className="player-profile-title">

                <span>
                  CURRENT PLAYER
                </span>

                <h2>
                  선수 프로필
                </h2>

              </div>


              <div className="player-profile-top">

                <div className="player-profile-image">

                  {currentPlayer.profileImage ? (

                    <img
                      src={currentPlayer.profileImage}
                      alt={currentPlayer.nickname}
                    />

                  ) : (

                    <span>
                      {currentPlayer.nickname.charAt(0)}
                    </span>

                  )}

                </div>


                <div className="player-profile-name">

                  <span>
                    현재 경매 선수
                  </span>

                  <strong>
                    {currentPlayer.nickname}
                  </strong>

                </div>

              </div>


              <div className="player-profile-info">

                <div className="profile-info-row">

                  <span>
                    최고 티어
                  </span>

                  <strong>
                    {currentPlayer.highestTier}
                  </strong>

                </div>


                <div className="profile-info-row">

                  <span>
                    현재 티어
                  </span>

                  <strong>
                    {currentPlayer.currentTier}
                  </strong>

                </div>


                <div className="profile-info-row">

                  <span>
                    주 포지션
                  </span>

                  <strong>
                    {currentPlayer.mainPosition}
                  </strong>

                </div>

              </div>


              <div className="player-message">

                <span>
                  한마디
                </span>

                <p>
                  "{currentPlayer.message}"
                </p>

              </div>

            </div>

          )}


          {/* 경매 순서 */}

          <div className="auction-order">

            <div className="auction-order-title">

              <div>

                <span>
                  NEXT
                </span>

                <h3>
                  경매 순서
                </h3>

              </div>


              <strong>
                {auctionPlayers.length}명
              </strong>

            </div>


            <div className="auction-order-list">

              {auctionPlayers.map(
                (player, index) => (

                  <div
                    className={`auction-order-player ${
                      index === 0
                        ? 'current'
                        : ''
                    }`}
                    key={player.id}
                  >

                    <span className="order-number">
                      {index + 1}
                    </span>


                    <div className="order-profile-image">

                      {player.profileImage ? (

                        <img
                          src={player.profileImage}
                          alt={player.nickname}
                        />

                      ) : (

                        <span>
                          {player.nickname.charAt(0)}
                        </span>

                      )}

                    </div>


                    <strong>
                      {player.nickname}
                    </strong>


                    {index === 0 && (

                      <span className="current-badge">
                        CURRENT
                      </span>

                    )}

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}


export default RoomPage