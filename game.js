/* =========================================================
   NEON RUNNER
   COMPLETE GAME.JS
   ========================================================= */

"use strict";

/* =========================================================
   CANVAS + HTML ELEMENTS
   ========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameUI = document.getElementById("gameUI");
const playButton = document.getElementById("playButton");

const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const menuHighScore = document.getElementById("menuHighScore");
const livesDisplay = document.getElementById("lives");

const pauseButton = document.getElementById("pauseButton");
const pauseOverlay = document.getElementById("pauseOverlay");

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const jumpButton = document.getElementById("jumpButton");

const startButton = document.getElementById("startButton");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const finalScore =
    document.getElementById("finalScore");

const finalBestScore =
    document.getElementById("finalBestScore");

const playAgainButton =
    document.getElementById("playAgainButton");


/* =========================================================
   GAME VARIABLES
   ========================================================= */

let score = 0;
let scoreTimer = 0;

let highScore =
    Number(localStorage.getItem("neonRunnerHighScore")) || 0;

let lives = 3;

let gameRunning = false;
let gameOver = false;
let paused = false;

let animationId = null;


/* =========================================================
   LANES
   ========================================================= */

const lanes = [75, 200, 325];

let playerLane = 1;


/* =========================================================
   PLAYER
   ========================================================= */

const player = {

    width: 45,

    height: 55,

    x: lanes[1] - 22.5,

    groundY: 500,

    y: 445,

    velocityY: 0,

    jumpPower: -17,

    gravity: 0.9,

    jumping: false

};


/* =========================================================
   GAME OBJECTS
   ========================================================= */

let obstacles = [];

let coins = [];

let effects = [];

let buildings = [];


/* =========================================================
   TIMERS
   ========================================================= */

let obstacleTimer = 0;

let coinTimer = 0;

let roadOffset = 0;

let buildingOffset = 0;


/* =========================================================
   AUDIO
   ========================================================= */

let audioContext = null;


function initAudio() {

    try {

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }

        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume();

        }

    } catch (error) {

        console.log(
            "Audio unavailable"
        );

    }

}


function playSound(type) {

    try {

        initAudio();

        if (!audioContext) {

            return;

        }

        const oscillator =
            audioContext.createOscillator();

        const gain =
            audioContext.createGain();

        oscillator.connect(gain);

        gain.connect(
            audioContext.destination
        );


        if (type === "jump") {

            oscillator.frequency.value = 500;

            oscillator.type = "sine";

            gain.gain.value = 0.08;

        }


        if (type === "coin") {

            oscillator.frequency.value = 800;

            oscillator.type = "triangle";

            gain.gain.value = 0.08;

        }


        if (type === "crash") {

            oscillator.frequency.value = 120;

            oscillator.type = "sawtooth";

            gain.gain.value = 0.12;

        }


        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.12
        );

    } catch (error) {

        console.log(
            "Sound unavailable"
        );

    }

}


/* =========================================================
   ROUNDED RECTANGLE COMPATIBILITY
   ========================================================= */

function roundedRect(
    x,
    y,
    width,
    height,
    radius
) {

    radius =
        Math.min(
            radius,
            width / 2,
            height / 2
        );

    ctx.beginPath();

    ctx.moveTo(
        x + radius,
        y
    );

    ctx.lineTo(
        x + width - radius,
        y
    );

    ctx.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    ctx.lineTo(
        x + width,
        y + height - radius
    );

    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    ctx.lineTo(
        x + radius,
        y + height
    );

    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    ctx.lineTo(
        x,
        y + radius
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    ctx.closePath();

}


/* =========================================================
   LANE PERSPECTIVE
   ========================================================= */

function getLaneX(
    lane,
    depth
) {

    const spread =
        50 + (83 * depth);

    return (
        200 +
        ((lane - 1) * spread)
    );

}


/* =========================================================
   FUTURISTIC CITY BUILDINGS
   ========================================================= */

function createBuildings() {

    buildings = [];

    /* LEFT SIDE BUILDINGS */

    for (let i = 0; i < 10; i++) {

        buildings.push({

            side: -1,

            z: i / 10,

            height:
                150 +
                Math.random() * 180,

            width:
                45 +
                Math.random() * 35,

            depth:
                0.8 +
                Math.random() * 0.4

        });

    }


    /* RIGHT SIDE BUILDINGS */

    for (let i = 0; i < 10; i++) {

        buildings.push({

            side: 1,

            z: i / 10,

            height:
                150 +
                Math.random() * 180,

            width:
                45 +
                Math.random() * 35,

            depth:
                0.8 +
                Math.random() * 0.4

        });

    }

}


/* =========================================================
   BACKGROUND + ROAD + BUILDINGS
   ========================================================= */
function drawBackground() {

    /* =====================================================
       SKY
    ===================================================== */

    const sky =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );

    sky.addColorStop(
        0,
        "#05001a"
    );

    sky.addColorStop(
        0.55,
        "#160044"
    );

    sky.addColorStop(
        1,
        "#001b3d"
    );

    ctx.fillStyle = sky;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /* =====================================================
       MOON
    ===================================================== */

    ctx.beginPath();

    ctx.arc(
        320,
        80,
        32,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(235,235,255,0.9)";

    ctx.fill();


    /* =====================================================
       DISTANT CITY HORIZON
    ===================================================== */

    ctx.fillStyle =
        "#08091c";

    ctx.fillRect(
        0,
        260,
        canvas.width,
        45
    );


    /* =====================================================
       SIDE CITY GROUND
    ===================================================== */

    /* LEFT SIDE */

    ctx.fillStyle =
        "#15182f";

    ctx.beginPath();

    ctx.moveTo(
        0,
        300
    );

    ctx.lineTo(
        125,
        300
    );

    ctx.lineTo(
        55,
        600
    );

    ctx.lineTo(
        0,
        600
    );

    ctx.closePath();

    ctx.fill();


    /* RIGHT SIDE */

    ctx.beginPath();

    ctx.moveTo(
        275,
        300
    );

    ctx.lineTo(
        400,
        300
    );

    ctx.lineTo(
        400,
        600
    );

    ctx.lineTo(
        345,
        600
    );

    ctx.closePath();

    ctx.fill();


    /* =====================================================
       SIDEWALK PANELS
    ===================================================== */

    ctx.strokeStyle =
        "rgba(100,110,180,0.35)";

    ctx.lineWidth = 2;


    /* LEFT SIDEWALK */

    for (
        let y = 330;
        y <= 600;
        y += 45
    ) {

        const progress =
            (y - 300) / 300;

        const roadLeft =
            125 -
            (70 * progress);

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            roadLeft,
            y
        );

        ctx.stroke();

    }


    /* RIGHT SIDEWALK */

    for (
        let y = 330;
        y <= 600;
        y += 45
    ) {

        const progress =
            (y - 300) / 300;

        const roadRight =
            275 +
            (70 * progress);

        ctx.beginPath();

        ctx.moveTo(
            roadRight,
            y
        );

        ctx.lineTo(
            400,
            y
        );

        ctx.stroke();

    }


    /* =====================================================
       BUILDINGS
    ===================================================== */

    buildings
        .sort(
            function(a, b) {

                return a.z - b.z;

            }
        )
        .forEach(
            function(building) {

                const depth =
                    Math.pow(
                        building.z,
                        1.35
                    );


                /*
                   BUILDING SIZE
                */

                const height =
                    building.height *
                    (
                        0.45 +
                        depth * 0.9
                    );


                const width =
                    building.width *
                    (
                        0.6 +
                        depth * 0.8
                    );


                /*
                   BUILDING BOTTOM

                   This makes the building
                   actually touch the roadside.
                */

                const baseY =
                    335 +
                    (
                        265 * depth
                    );


                let x;


                /* LEFT BUILDINGS */

                if (
                    building.side === -1
                ) {

                    x =
                        8 +
                        (
                            92 *
                            (1 - depth)
                        ) -
                        width;

                }


                /* RIGHT BUILDINGS */

                else {

                    x =
                        392 -
                        (
                            92 *
                            (1 - depth)
                        );

                }


                /* =================================================
                   MAIN BUILDING
                ================================================= */

                ctx.fillStyle =
                    "#10142f";

                ctx.fillRect(
                    x,
                    baseY - height,
                    width,
                    height
                );


                /* =================================================
                   BUILDING SIDE
                ================================================= */

                ctx.fillStyle =
                    "#080b20";


                if (
                    building.side === -1
                ) {

                    ctx.fillRect(
                        x,
                        baseY - height,
                        Math.max(
                            5,
                            width * 0.10
                        ),
                        height
                    );

                }

                else {

                    ctx.fillRect(
                        x +
                        width -
                        Math.max(
                            5,
                            width * 0.10
                        ),

                        baseY - height,

                        Math.max(
                            5,
                            width * 0.10
                        ),

                        height
                    );

                }


                /* =================================================
                   NEON OUTLINE
                ================================================= */

                ctx.strokeStyle =
                    "#5140ff";

                ctx.lineWidth =
                    Math.max(
                        2,
                        3 * depth
                    );


                ctx.beginPath();


                if (
                    building.side === -1
                ) {

                    ctx.moveTo(
                        x + width,
                        baseY - height
                    );

                    ctx.lineTo(
                        x + width,
                        baseY
                    );

                }

                else {

                    ctx.moveTo(
                        x,
                        baseY - height
                    );

                    ctx.lineTo(
                        x,
                        baseY
                    );

                }


                ctx.stroke();


                /* =================================================
                   ROOFTOP
                ================================================= */

                ctx.fillStyle =
                    "#1c2150";

                ctx.fillRect(
                    x - 3,
                    baseY - height - 6,
                    width + 6,
                    6
                );


                /* =================================================
                   WINDOWS
                ================================================= */

                const windowSize =
                    Math.max(
                        3,
                        4 * depth
                    );


                const rowGap =
                    Math.max(
                        13,
                        19 * depth
                    );


                ctx.fillStyle =
                    "#ffd85c";


                for (
                    let row = 0;
                    row < 14;
                    row++
                ) {

                    for (
                        let col = 0;
                        col < 3;
                        col++
                    ) {

                        const wx =
                            x +
                            8 +
                            col *
                            (
                                width / 3
                            );


                        const wy =
                            baseY -
                            height +
                            15 +
                            row *
                            rowGap;


                        if (
                            wx <
                            x + width - 7 &&
                            wy <
                            baseY - 10
                        ) {

                            ctx.fillRect(
                                wx,
                                wy,
                                windowSize,
                                windowSize + 2
                            );

                        }

                    }

                }


                /* =================================================
                   ROOFTOP ANTENNA
                ================================================= */

                if (
                    depth > 0.45
                ) {

                    const antennaX =
                        x +
                        width / 2;


                    ctx.strokeStyle =
                        "#00eaff";

                    ctx.lineWidth = 2;


                    ctx.beginPath();

                    ctx.moveTo(
                        antennaX,
                        baseY - height
                    );

                    ctx.lineTo(
                        antennaX,
                        baseY - height - 15
                    );

                    ctx.stroke();


                    ctx.beginPath();

                    ctx.arc(
                        antennaX,
                        baseY - height - 15,
                        3,
                        0,
                        Math.PI * 2
                    );

                    ctx.fillStyle =
                        "#00eaff";

                    ctx.fill();

                }

            }
        );


    /* =====================================================
       ROAD
    ===================================================== */
/* =====================================================
   WIDER ROAD
   ===================================================== */

ctx.beginPath();

/* TOP LEFT */
ctx.moveTo(
    125,
    300
);

/* TOP RIGHT */
ctx.lineTo(
    275,
    300
);

/* BOTTOM RIGHT */
ctx.lineTo(
    400,
    600
);

/* BOTTOM LEFT */
ctx.lineTo(
    0,
    600
);

ctx.closePath();

ctx.fillStyle =
    "#202038";

ctx.fill();


    /* =====================================================
       ROAD NEON EDGES
    ===================================================== */

    ctx.strokeStyle =
        "#b58cff";

    ctx.lineWidth = 5;


   /* =====================================================
   WIDER ROAD EDGES
   ===================================================== */

ctx.strokeStyle =
    "#b58cff";

ctx.lineWidth = 5;


/* LEFT ROAD EDGE */

ctx.beginPath();

ctx.moveTo(
    125,
    300
);

ctx.lineTo(
    0,
    600
);

ctx.stroke();


/* RIGHT ROAD EDGE */

ctx.beginPath();

ctx.moveTo(
    275,
    300
);

ctx.lineTo(
    400,
    600
);

ctx.stroke();

    /* =====================================================
       MOVING ROAD LIGHTS
    ===================================================== */

    if (
        gameRunning &&
        !paused
    ) {

        roadOffset +=
            0.012;


        if (
            roadOffset >= 1
        ) {

            roadOffset = 0;

        }

    }


    for (
        let i = 0;
        i < 9;
        i++
    ) {

        const z =
            (
                i / 9 +
                roadOffset
            ) % 1;


        const depth =
            Math.pow(
                z,
                1.5
            );


        const y =
            300 +
            (
                300 * depth
            );


        const leftX =
            getLaneX(
                0,
                depth
            );


        const rightX =
            getLaneX(
                2,
                depth
            );


        const dashLength =
            Math.max(
                4,
                14 * depth
            );


        ctx.strokeStyle =
            "rgba(150,130,255,0.9)";

        ctx.lineWidth =
            Math.max(
                2,
                3 * depth
            );


        /* LEFT LANE MARKING */

        ctx.beginPath();

        ctx.moveTo(
            leftX,
            y
        );

        ctx.lineTo(
            leftX,
            y + dashLength
        );

        ctx.stroke();


        /* RIGHT LANE MARKING */

        ctx.beginPath();

        ctx.moveTo(
            rightX,
            y
        );

        ctx.lineTo(
            rightX,
            y + dashLength
        );

        ctx.stroke();

    }

}


/* =========================================================
   PLAYER DRAWING
   ========================================================= */

function drawPlayer() {

    const runBounce =
        (
            gameRunning &&
            !player.jumping &&
            !paused
        )
            ?
            Math.abs(
                Math.sin(
                    Date.now() * 0.012
                )
            ) * 5
            :
            0;


    const renderY =
        player.y -
        runBounce;


    const centerX =
        player.x +
        player.width / 2;


    /* SHADOW */

    ctx.beginPath();

    ctx.ellipse(
        centerX,
        505,
        27,
        7,
        0,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(0,234,255,0.25)";

    ctx.fill();


    /* LEGS */

    ctx.strokeStyle =
        "#00eaff";

    ctx.lineWidth = 8;

    ctx.lineCap = "round";


    ctx.beginPath();

    ctx.moveTo(
        centerX - 8,
        renderY + 38
    );

    ctx.lineTo(
        centerX - 13,
        renderY + 55
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        centerX + 8,
        renderY + 38
    );

    ctx.lineTo(
        centerX + 13,
        renderY + 55
    );

    ctx.stroke();


    /* BODY */

    const bodyGradient =
        ctx.createLinearGradient(
            player.x,
            renderY,
            player.x + player.width,
            renderY + player.height
        );


    bodyGradient.addColorStop(
        0,
        "#00eaff"
    );

    bodyGradient.addColorStop(
        1,
        "#7c5cff"
    );


    ctx.fillStyle =
        bodyGradient;

    ctx.shadowBlur = 15;

    ctx.shadowColor =
        "#00eaff";


    roundedRect(
        player.x + 4,
        renderY + 8,
        player.width - 8,
        35,
        10
    );

    ctx.fill();


    ctx.shadowBlur = 0;


    /* HEAD */

    ctx.beginPath();

    ctx.arc(
        centerX,
        renderY,
        14,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#f1f1ff";

    ctx.fill();


    /* VISOR */

    ctx.fillStyle =
        "#171033";


    roundedRect(
        centerX - 12,
        renderY - 4,
        24,
        7,
        4
    );

    ctx.fill();


    /* ARMS */

    ctx.strokeStyle =
        "#00eaff";

    ctx.lineWidth = 7;


    ctx.beginPath();

    ctx.moveTo(
        player.x + 5,
        renderY + 16
    );

    ctx.lineTo(
        player.x - 5,
        renderY + 29
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        player.x + player.width - 5,
        renderY + 16
    );

    ctx.lineTo(
        player.x + player.width + 5,
        renderY + 29
    );

    ctx.stroke();


    ctx.lineCap = "butt";

}


/* =========================================================
   OBSTACLES
   ========================================================= */

function spawnObstacle() {

    const lane =
        Math.floor(
            Math.random() * 3
        );


    obstacles.push({

        z: 0,

        speed:
            0.0065 +
            Math.min(
                0.0015,
                score / 40000
            ),

        lane: lane,

        hit: false,

        renderX: 0,

        renderY: 0,

        renderW: 0,

        renderH: 0

    });

}


function drawObstacle(
    obstacle
) {

    const depth =
        Math.pow(
            obstacle.z,
            1.5
        );


    const scale =
        0.15 +
        (0.85 * depth);


    const y =
        300 +
        (300 * depth);


    const x =
        getLaneX(
            obstacle.lane,
            depth
        );


    const width =
        50 * scale;


    const height =
        60 * scale;


    const drawX =
        x -
        width / 2;


    const drawY =
        y -
        height;


    obstacle.renderX =
        drawX;

    obstacle.renderY =
        drawY;

    obstacle.renderW =
        width;

    obstacle.renderH =
        height;


    const gradient =
        ctx.createLinearGradient(
            drawX,
            drawY,
            drawX + width,
            drawY + height
        );


    gradient.addColorStop(
        0,
        "#ff3864"
    );

    gradient.addColorStop(
        1,
        "#7b00ff"
    );


    ctx.fillStyle =
        gradient;

    ctx.shadowBlur =
        18 * scale;

    ctx.shadowColor =
        "#ff3864";


    roundedRect(
        drawX,
        drawY,
        width,
        height,
        Math.max(
            3,
            10 * scale
        )
    );

    ctx.fill();


    ctx.shadowBlur = 0;
    /* LIGHT */

    ctx.fillStyle =
        "#ffffff";


    ctx.beginPath();

    ctx.arc(
        x,
        drawY +
        (15 * scale),
        Math.max(
            1,
            5 * scale
        ),
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* STRIPE */

    ctx.strokeStyle =
        "rgba(255,255,255,0.6)";

    ctx.lineWidth =
        Math.max(
            1,
            3 * scale
        );


    ctx.beginPath();

    ctx.moveTo(
        drawX +
        (8 * scale),
        drawY +
        (30 * scale)
    );

    ctx.lineTo(
        drawX +
        width -
        (8 * scale),
        drawY +
        (30 * scale)
    );

    ctx.stroke();

}


/* =========================================================
   COINS
   ========================================================= */

function spawnCoin() {

    const lane =
        Math.floor(
            Math.random() * 3
        );


    coins.push({

        z: 0,

        speed:
            0.0075 +
            Math.min(
                0.0015,
                score / 40000
            ),

        lane: lane,

        rotation: 0,

        collected: false,

        renderX: 0,

        renderY: 0,

        renderRadius: 0

    });

}


function drawCoin(
    coin
) {

    coin.rotation += 0.08;


    const depth =
        Math.pow(
            coin.z,
            1.5
        );


    const scale =
        0.15 +
        (0.85 * depth);


    const y =
        300 +
        (300 * depth);


    const x =
        getLaneX(
            coin.lane,
            depth
        );


    const radius =
        14 * scale;


    coin.renderX =
        x;

    coin.renderY =
        y - radius;

    coin.renderRadius =
        radius;


    ctx.save();


    ctx.translate(
        x,
        y - radius
    );


    ctx.scale(
        Math.max(
            0.15,
            Math.abs(
                Math.cos(
                    coin.rotation
                )
            )
        ),
        1
    );


    ctx.shadowBlur =
        15 * scale;

    ctx.shadowColor =
        "#ffd700";


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#ffd700";

    ctx.fill();


    ctx.shadowBlur = 0;


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        radius * 0.5,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#fff3a0";

    ctx.fill();


    ctx.restore();

}


/* =========================================================
   EFFECTS
   ========================================================= */

function createEffect(
    x,
    y,
    type
) {

    for (
        let i = 0;
        i < 15;
        i++
    ) {

        effects.push({

            x: x,

            y: y,

            vx:
                (
                    Math.random() - 0.5
                ) * 6,

            vy:
                (
                    Math.random() - 0.5
                ) * 6,

            life: 30,

            type: type

        });

    }

}


function updateEffects() {

    effects.forEach(
        function(effect) {

            effect.x +=
                effect.vx;

            effect.y +=
                effect.vy;

            effect.life--;

        }
    );


    effects =
        effects.filter(
            function(effect) {

                return (
                    effect.life > 0
                );

            }
        );

}


function drawEffects() {

    effects.forEach(
        function(effect) {

            ctx.globalAlpha =
                effect.life / 30;


            ctx.fillStyle =
                effect.type === "coin"
                    ? "#ffd700"
                    : "#ff3864";


            ctx.beginPath();

            ctx.arc(
                effect.x,
                effect.y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    ctx.globalAlpha = 1;

}


/* =========================================================
   PLAYER MOVEMENT
   ========================================================= */

function moveLeft() {

    if (
        !gameRunning ||
        gameOver ||
        paused
    ) {

        return;

    }


    if (
        playerLane > 0
    ) {

        playerLane--;

        player.x =
            lanes[playerLane] -
            player.width / 2;

    }

}


function moveRight() {

    if (
        !gameRunning ||
        gameOver ||
        paused
    ) {

        return;

    }


    if (
        playerLane < 2
    ) {

        playerLane++;

        player.x =
            lanes[playerLane] -
            player.width / 2;

    }

}


function jumpPlayer() {

    if (
        !gameRunning ||
        gameOver ||
        paused
    ) {

        return;

    }


    if (
        player.jumping
    ) {

        return;

    }


    player.jumping = true;

    player.velocityY =
        player.jumpPower;

    playSound("jump");

}


/* =========================================================
   PLAYER PHYSICS
   ========================================================= */

function updatePlayer() {

    if (
        !player.jumping
    ) {

        return;

    }


    player.y +=
        player.velocityY;


    player.velocityY +=
        player.gravity;


    const groundPosition =
        player.groundY -
        player.height;


    if (
        player.y >=
        groundPosition
    ) {

        player.y =
            groundPosition;

        player.velocityY = 0;

        player.jumping = false;

    }

}


/* =========================================================
   COLLISION
   ========================================================= */

function checkCollision() {

    /* OBSTACLES */

    obstacles.forEach(
        function(obstacle) {

            if (
                obstacle.hit ||
                obstacle.z < 0.78
            ) {

                return;

            }


            const playerLeft =
                player.x;

            const playerRight =
                player.x +
                player.width;

            const playerTop =
                player.y;

            const playerBottom =
                player.y +
                player.height;


            const obstacleLeft =
                obstacle.renderX;

            const obstacleRight =
                obstacle.renderX +
                obstacle.renderW;

            const obstacleTop =
                obstacle.renderY;

            const obstacleBottom =
                obstacle.renderY +
                obstacle.renderH;


            const collision =
                playerLeft <
                obstacleRight &&
                playerRight >
                obstacleLeft &&
                playerTop <
                obstacleBottom &&
                playerBottom >
                obstacleTop;


            if (
                collision
            ) {

                obstacle.hit = true;

                lives--;

                updateLives();


                createEffect(
                    player.x +
                    player.width / 2,
                    player.y +
                    player.height / 2,
                    "crash"
                );


                playSound(
                    "crash"
                );


                if (
                    lives <= 0
                ) {

                    endGame();

                }

            }

        }
    );


    /* COINS */

    coins.forEach(
        function(coin) {

            if (
                coin.collected ||
                coin.z < 0.78
            ) {

                return;

            }


            const dx =
                (
                    player.x +
                    player.width / 2
                ) -
                coin.renderX;


            const dy =
                (
                    player.y +
                    player.height / 2
                ) -
                coin.renderY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance < 38
            ) {

                coin.collected = true;

                score += 5;


                scoreDisplay.textContent =
                    score;


                createEffect(
                    coin.renderX,
                    coin.renderY,
                    "coin"
                );


                playSound(
                    "coin"
                );

            }

        }
    );


    coins =
        coins.filter(
            function(coin) {

                return (
                    !coin.collected
                );

            }
        );

}


/* =========================================================
   LIVES
   ========================================================= */

function updateLives() {

    if (
        lives === 3
    ) {

        livesDisplay.textContent =
            "❤️❤️❤️";

    }

    else if (
        lives === 2
    ) {

        livesDisplay.textContent =
            "❤️❤️";

    }

    else if (
        lives === 1
    ) {

        livesDisplay.textContent =
            "❤️";

    }

    else {

        livesDisplay.textContent =
            "";

    }

}
/* =========================================================
   END GAME
   ========================================================= */

function endGame() {

    gameOver = true;

    gameRunning = false;


    if (
        score > highScore
    ) {

        highScore = score;


        localStorage.setItem(
            "neonRunnerHighScore",
            highScore
        );

    }


    highScoreDisplay.textContent =
        highScore;

    menuHighScore.textContent =
        highScore;


    if (
        finalScore
    ) {

        finalScore.textContent =
            score;

    }


    if (
        finalBestScore
    ) {

        finalBestScore.textContent =
            highScore;

    }


    if (
        gameOverScreen
    ) {

        gameOverScreen.style.display =
            "block";

    }


    if (
        pauseButton
    ) {

        pauseButton.style.display =
            "none";

    }


    if (
        pauseOverlay
    ) {

        pauseOverlay.style.display =
            "none";

    }

}


/* =========================================================
   GAME UPDATE
   ========================================================= */

function updateGame() {

    if (
        !gameRunning ||
        gameOver ||
        paused
    ) {

        return;

    }


    /* SCORE */

    scoreTimer++;


    if (
        scoreTimer >= 45
    ) {

        score++;

        scoreDisplay.textContent =
            score;

        scoreTimer = 0;

    }


    /* HIGH SCORE */

    if (
        score > highScore
    ) {

        highScore = score;


        localStorage.setItem(
            "neonRunnerHighScore",
            highScore
        );


        highScoreDisplay.textContent =
            highScore;

        menuHighScore.textContent =
            highScore;

    }


    /* PLAYER */

    updatePlayer();


    /* BUILDINGS */

    buildingOffset += 0.006;


    if (
        buildingOffset >= 1
    ) {

        buildingOffset = 0;

    }


    buildings.forEach(
        function(building) {

            building.z += 0.006;


            if (
                building.z >= 1
            ) {

                building.z = 0;


                building.height =
                    160 +
                    Math.random() * 150;


                building.width =
                    45 +
                    Math.random() * 35;

            }

        }
    );


    /* OBSTACLES */

    obstacleTimer++;


    const obstacleInterval =
        Math.max(
            90,
            120 -
            Math.floor(
                score / 250
            )
        );


    if (
        obstacleTimer >=
        obstacleInterval
    ) {

        spawnObstacle();

        obstacleTimer = 0;

    }


    /* COINS */

    coinTimer++;


    if (
        coinTimer >= 80
    ) {

        spawnCoin();

        coinTimer = 0;

    }


    /* MOVE OBSTACLES */

    obstacles.forEach(
        function(obstacle) {

            obstacle.z +=
                obstacle.speed;

        }
    );


    obstacles =
        obstacles.filter(
            function(obstacle) {

                return (
                    obstacle.z <= 1.1
                );

            }
        );


    /* MOVE COINS */

    coins.forEach(
        function(coin) {

            coin.z +=
                coin.speed;

        }
    );


    coins =
        coins.filter(
            function(coin) {

                return (
                    coin.z <= 1.1
                );

            }
        );


    /* EFFECTS */

    updateEffects();

}


/* =========================================================
   DRAW GAME
   ========================================================= */

function drawGame() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawBackground();


    /* FAR OBJECTS FIRST */

    coins.sort(
        function(a, b) {

            return a.z - b.z;

        }
    );


    obstacles.sort(
        function(a, b) {

            return a.z - b.z;

        }
    );


    coins.forEach(
        function(coin) {

            drawCoin(coin);

        }
    );


    obstacles.forEach(
        function(obstacle) {

            drawObstacle(
                obstacle
            );

        }
    );


    /* COLLISION AFTER POSITIONS */

    checkCollision();


    /* PLAYER */

    drawPlayer();


    /* EFFECTS */

    drawEffects();

}


/* =========================================================
   GAME LOOP
   ========================================================= */

function gameLoop() {

    if (
        !gameRunning
    ) {

        return;

    }


    if (
        !paused
    ) {

        updateGame();

        drawGame();

    }


    animationId =
        requestAnimationFrame(
            gameLoop
        );

}


/* =========================================================
   START GAME
   ========================================================= */

function startGame() {

    cancelAnimationFrame(
        animationId
    );


    score = 0;

    scoreTimer = 0;

    lives = 3;

    gameOver = false;

    paused = false;

    gameRunning = true;


    playerLane = 1;


    player.x =
        lanes[playerLane] -
        player.width / 2;


    player.y =
        player.groundY -
        player.height;


    player.velocityY = 0;

    player.jumping = false;


    obstacles = [];

    coins = [];

    effects = [];


    obstacleTimer = 0;

    coinTimer = 0;

    roadOffset = 0;

    buildingOffset = 0;


    createBuildings();


    scoreDisplay.textContent =
        "0";


    livesDisplay.textContent =
        "❤️❤️❤️";


    highScoreDisplay.textContent =
        highScore;


    menuHighScore.textContent =
        highScore;


    if (
        gameOverScreen
    ) {

        gameOverScreen.style.display =
            "none";

    }


    if (
        pauseOverlay
    ) {

        pauseOverlay.style.display =
            "none";

    }


    if (
        pauseButton
    ) {

        pauseButton.style.display =
            "inline-block";

        pauseButton.textContent =
            "⏸ PAUSE";

    }


    drawGame();


    gameLoop();

}


/* =========================================================
   PLAY BUTTON
   ========================================================= */

if (
    playButton
) {

    playButton.addEventListener(
        "click",
        function() {

            initAudio();


            startScreen.style.display =
                "none";


            gameUI.style.display =
                "block";


            startGame();

        }
    );

}


/* =========================================================
   PLAY AGAIN
   ========================================================= */

if (
    playAgainButton
) {

    playAgainButton.addEventListener(
        "click",
        function() {

            initAudio();

            startGame();

        }
    );

}


/* =========================================================
   OLD START BUTTON
   ========================================================= */

if (
    startButton
) {

    startButton.addEventListener(
        "click",
        function() {

            initAudio();

            startGame();

        }
    );

}


/* =========================================================
   PAUSE
   ========================================================= */

if (
    pauseButton
) {

    pauseButton.addEventListener(
        "click",
        function() {

            if (
                !gameRunning ||
                gameOver
            ) {

                return;

            }


            paused =
                !paused;


            if (
                paused
            ) {

                if (
                    pauseOverlay
                ) {

                    pauseOverlay.style.display =
                        "block";

                }


                pauseButton.textContent =
                    "▶ RESUME";

            }

            else {

                if (
                    pauseOverlay
                ) {

                    pauseOverlay.style.display =
                        "none";

                }


                pauseButton.textContent =
                    "⏸ PAUSE";

            }

        }
    );

}


/* =========================================================
   MOBILE LEFT BUTTON
   ========================================================= */

if (
    leftButton
) {

    leftButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            moveLeft();

        }
    );

}


/* =========================================================
   MOBILE RIGHT BUTTON
   ========================================================= */

if (
    rightButton
) {

    rightButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            moveRight();

        }
    );

}


/* =========================================================
   MOBILE JUMP BUTTON
   ========================================================= */

if (
    jumpButton
) {

    jumpButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            jumpPlayer();

        }
    );

}


/* =========================================================
   KEYBOARD CONTROLS
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "ArrowLeft" ||
            event.key === "a" ||
            event.key === "A"
        ) {

            event.preventDefault();

            moveLeft();

        }


        if (
            event.key === "ArrowRight" ||
            event.key === "d" ||
            event.key === "D"
        ) {

            event.preventDefault();

            moveRight();

        }


        if (
            event.key === "ArrowUp" ||
            event.key === "w" ||
            event.key === "W" ||
            event.key === " "
        ) {

            event.preventDefault();

            jumpPlayer();

        }

    }
);


/* =========================================================
   SWIPE CONTROLS
   ========================================================= */

let touchStartX = 0;

let touchStartY = 0;


canvas.addEventListener(
    "touchstart",
    function(event) {

        const touch =
            event.changedTouches[0];


        touchStartX =
            touch.clientX;


        touchStartY =
            touch.clientY;

    },
    {
        passive: true
    }
);


canvas.addEventListener(
    "touchend",
    function(event) {

        const touch =
            event.changedTouches[0];


        const dx =
            touch.clientX -
            touchStartX;


        const dy =
            touch.clientY -
            touchStartY;


        if (
            Math.abs(dx) >
            Math.abs(dy)
        ) {

            if (
                Math.abs(dx) > 30
            ) {

                if (
                    dx > 0
                ) {

                    moveRight();

                }

                else {

                    moveLeft();

                }

            }

        }

        else {

            if (
                dy < -30
            ) {

                jumpPlayer();

            }

        }

    },
    {
        passive: true
    }
);


/* =========================================================
   INITIAL VALUES
   ========================================================= */

highScoreDisplay.textContent =
    highScore;


menuHighScore.textContent =
    highScore;


livesDisplay.textContent =
    "❤️❤️❤️";


createBuildings();


drawBackground();


drawPlayer();