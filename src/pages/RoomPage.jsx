import { useEffect, useRef } from 'react'
import './RoomPage.css'


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


  useEffect(() => {
    currentBidRef.current = currentBid
  }, [currentBid])


  useEffect(() => {
    highestBidTeamRef.current = highestBidTeam
  }, [highestBidTeam])


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

    if (auctionStarted) {
      return
    }


    const numericParticipantId =
      Number(participantId)


    // 팀장 해제
    if (!participantId) {

      setTeams((prevTeams) =>
        prevTeams.map((team) =>
          team.id === teamId
            ? {
                ...team,
                leader: null
              }
            : team
        )
      )

      return
    }


    const participant =
      roomParticipants.find(
        (user) =>
          user.id === numericParticipantId
      )


    if (!participant) {
      return
    }


    // 다른 팀에서 이미 팀장인지 확인
    const alreadyLeader =
      teams.find(
        (team) =>
          team.id !== teamId &&
          team.leader?.id === participant.id
      )


    if (alreadyLeader) {

      alert(
        `${participant.nickname}님은 이미 ${alreadyLeader.name} 팀장입니다.`
      )

      return
    }


    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              leader: participant
            }
          : team
      )
    )
  }


  // =========================
  // 팀 포인트 변경
  // =========================

  const handleTeamPointsChange = (
    teamId,
    value
  ) => {

    if (auctionStarted) {
      return
    }


    const points =
      Math.max(
        0,
        Number(value) || 0
      )


    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              points
            }
          : team
      )
    )
  }


  // =========================
  // 관리자 설정 완료
  //
  // 팀장은 경매 대상에서 제외
  // =========================

  const handleSaveAdminSettings = () => {

    const leaderIds =
      teams
        .filter((team) => team.leader)
        .map((team) => team.leader.id)


    const players =
      roomParticipants.filter(
        (participant) =>
          !leaderIds.includes(
            participant.id
          )
      )


    setAuctionPlayers(players)

    setCurrentBid(0)
    setHighestBidTeam(null)

    setTimeLeft(15)

    setAdminSettingsOpen(false)


    setAuctionLogs((prevLogs) => [
      ...prevLogs,
      `관리자 설정 완료 - ${activeTeams.length}개 팀 / 경매 선수 ${players.length}명`
    ])
  }


  // =========================
  // 선수 순서 위 / 아래
  // =========================

  const movePlayer = (
    index,
    direction
  ) => {

    if (auctionStarted) {
      return
    }


    const targetIndex =
      index + direction


    if (
      targetIndex < 0 ||
      targetIndex >= auctionPlayers.length
    ) {
      return
    }


    setAuctionPlayers(
      (prevPlayers) => {

        const newPlayers =
          [...prevPlayers]


        ;[
          newPlayers[index],
          newPlayers[targetIndex]
        ] = [
          newPlayers[targetIndex],
          newPlayers[index]
        ]


        return newPlayers
      }
    )
  }


  // =========================
  // 랜덤 섞기
  // =========================

  const shufflePlayers = () => {

    if (auctionStarted) {
      return
    }


    setAuctionPlayers(
      (prevPlayers) => {

        const shuffled =
          [...prevPlayers]


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


        return shuffled
      }
    )
  }


  // =========================
  // 경매 시작
  // =========================

  const handleStartAuction = () => {

    if (!isAdmin) {
      return
    }


    if (activeTeams.length < 2) {

      alert(
        '경매를 시작하려면 최소 2개의 팀에 팀장을 지정해주세요.'
      )

      return
    }


    if (auctionPlayers.length === 0) {

      alert(
        '경매 참가자가 없습니다. 관리자 설정을 먼저 완료해주세요.'
      )

      return
    }


    setAdminSettingsOpen(false)

    setCurrentBid(0)
    setHighestBidTeam(null)

    currentBidRef.current = 0
    highestBidTeamRef.current = null

    setTimeLeft(15)

    setAuctionStarted(true)


    setAuctionLogs(
      (prevLogs) => [
        ...prevLogs,
        `${auctionPlayers[0].nickname} 경매 시작`
      ]
    )
  }


  // =========================
  // 입찰
  // =========================

  const handleBid = (amount) => {

    if (!auctionStarted) {
      return
    }


    if (!myLeaderTeam) {

      alert(
        '팀장만 입찰할 수 있습니다.'
      )

      return
    }


    const newBid =
      currentBidRef.current + amount


    if (
      newBid >
      myLeaderTeam.points
    ) {

      alert(
        `${myLeaderTeam.name}의 남은 포인트가 부족합니다.`
      )

      return
    }


    currentBidRef.current =
      newBid

    highestBidTeamRef.current =
      myLeaderTeam.id


    setCurrentBid(newBid)

    setHighestBidTeam(
      myLeaderTeam.id
    )


    setAuctionLogs(
      (prevLogs) => [
        ...prevLogs,
        `${myLeaderTeam.name} +${amount}P 입찰 → ${newBid}P`
      ]
    )
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


    // =========================
    // 유찰
    // =========================

    if (finalTeamId === null) {

      setAuctionLogs(
        (prevLogs) => [
          ...prevLogs,
          `${player.nickname} 유찰 - 맨 뒤로 이동`
        ]
      )


      setAuctionPlayers(
        (prevPlayers) => {

          if (
            prevPlayers.length <= 1
          ) {
            return prevPlayers
          }


          return [
            ...prevPlayers.slice(1),
            prevPlayers[0]
          ]
        }
      )

    } else {

      // =========================
      // 낙찰
      // =========================

      const winningTeam =
        teams.find(
          (team) =>
            team.id === finalTeamId
        )


      if (winningTeam) {

        setTeams(
          (prevTeams) =>
            prevTeams.map(
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
        )


        setAuctionLogs(
          (prevLogs) => [
            ...prevLogs,
            `${player.nickname} → ${winningTeam.name} ${finalBid}P 낙찰`
          ]
        )
      }


      // 낙찰 선수 제거

      setAuctionPlayers(
        (prevPlayers) =>
          prevPlayers.slice(1)
      )
    }


    // 다음 선수용 초기화

    currentBidRef.current = 0
    highestBidTeamRef.current = null

    setCurrentBid(0)
    setHighestBidTeam(null)

    setTimeLeft(15)
  }


  // =========================
  // 15.00초 타이머
  // =========================

  useEffect(() => {

    if (!auctionStarted) {
      return
    }


    if (!currentPlayer) {

      setAuctionStarted(false)

      setTimeLeft(0)

      return
    }


    const playerAtStart =
      currentPlayer


    const endTime =
      performance.now() + 15000


    const timer =
      setInterval(() => {

        const remaining =
          Math.max(
            0,
            (
              endTime -
              performance.now()
            ) / 1000
          )


        setTimeLeft(remaining)


        if (remaining <= 0) {

          clearInterval(timer)

          finishAuction(
            playerAtStart
          )
        }

      }, 10)


    return () => {
      clearInterval(timer)
    }

  }, [
    auctionStarted,
    currentPlayer?.id
  ])


  // =========================
  // 다음 선수 시작 로그
  // =========================

  useEffect(() => {

    if (!auctionStarted) {
      return
    }


    if (!currentPlayer) {

      setAuctionStarted(false)

      setTimeLeft(0)

      setAuctionLogs(
        (prevLogs) => [
          ...prevLogs,
          '모든 선수의 경매가 종료되었습니다.'
        ]
      )

      return
    }


    setTimeLeft(15)


    setAuctionLogs(
      (prevLogs) => {

        const message =
          `${currentPlayer.nickname} 경매 시작`


        if (
          prevLogs[
            prevLogs.length - 1
          ] === message
        ) {
          return prevLogs
        }


        return [
          ...prevLogs,
          message
        ]
      }
    )

  }, [currentPlayer?.id])


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
            onClick={() =>
              setPage('lobby')
            }
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