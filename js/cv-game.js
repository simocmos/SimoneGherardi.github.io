document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const modal = document.getElementById('game-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-modal');

    // Mobile Control Buttons
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnInteract = document.getElementById('btn-interact');
    const btnAttack = document.getElementById('btn-attack');

    // Visibility Observer for Mobile Controls
    const gameSection = document.getElementById('cv-game');
    const mobileControls = document.getElementById('mobile-controls');
    if (gameSection && mobileControls) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    mobileControls.classList.add('active');
                } else {
                    mobileControls.classList.remove('active');
                }
            });
        }, { threshold: 0.1 });
        observer.observe(gameSection);
    }

    // --- Game Constants & State ---
    const TILE_SIZE = 50;
    const PLAYER_SPEED = 4;
    const SWORD_RANGE = 60;
    const SWORD_SWING_DURATION = 15; // frames
    const SWORD_DAMAGE = 34;

    const COLORS = {
        wall: '#111',
        door: {
            closed: '#3b82f6',
            open: 'rgba(0,0,0,0.5)'
        },
        text: '#fff',
        doc: '#fff',
        background: '#2d2d2d'
    };

    let gameState = {
        currentLevel: 'hub',
        paused: false,
        player: { 
            x: 400, y: 250, 
            radius: 15, 
            angle: 0, 
            color: '#3b82f6',
            attacking: false,
            attackTimer: 0
        },
        keys: { w: false, a: false, s: false, d: false },
        mobileKeys: { w: false, a: false, s: false, d: false },
        mouse: { x: 0, y: 0, leftDown: false, rightDown: false },
        entities: [],
        particles: [],
        interactableDoc: null
    };

    // --- Level Data ---
    const levels = {
        'hub': {
            background: '#2d2d2d',
            walls: [
                {x: 0, y: 0, w: 800, h: 50}, // Top
                {x: 0, y: 450, w: 800, h: 50}, // Bottom
                {x: 0, y: 0, w: 50, h: 500}, // Left
                {x: 750, y: 0, w: 50, h: 500} // Right
            ],
            doors: [
                {id: 1, x: 350, y: 0, w: 100, h: 50, hp: 100, maxHp: 100, target: 'experience', label: 'Experience', color: '#10b981'},
                {id: 2, x: 750, y: 200, w: 50, h: 100, hp: 100, maxHp: 100, target: 'education', label: 'Education', color: '#8b5cf6'},
                {id: 3, x: 350, y: 450, w: 100, h: 50, hp: 100, maxHp: 100, target: 'projects', label: 'Projects', color: '#f59e0b'},
                {id: 4, x: 0, y: 200, w: 50, h: 100, hp: 100, maxHp: 100, target: 'skills', label: 'Skills', color: '#0ea5e9'}
            ],
            docs: []
        },
        'experience': {
            background: '#064e3b',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 350, y: 450, w: 100, h: 50, hp: 0, maxHp: 100, target: 'hub', label: 'Back to Hub', color: '#666', open: true}
            ],
            docs: [
                {x: 380, y: 300, w: 40, h: 40, title: 'Amadeus - Backend Software Developer', content: '<h3>Backend Software Developer</h3><p><b>Amadeus, via ALTEN contractor | Nice, France | Jan 2024 - Present</b></p><p><b>Tools:</b> C++, Scala, Python, Bash, Claude, CI/CD, MongoDB</p><ul><li>Develop Revenue Management features for demand forecasting and dynamic ticket pricing.</li><li>Support the migration from Erding to Azure.</li><li>Create integration tests and maintain the Python CI/CD test suite.</li><li>Build, integrate, and review Claude Opus development agents.</li><li>Use AI to improve deprecated or untested code.</li><li>Maintain cross-batch Scala repositories.</li><li>Coordinate production deployments with the Changes Control Board.</li><li>Host technical interviews for ALTEN developer candidates.</li></ul>'},
                {x: 140, y: 150, w: 40, h: 40, title: 'Amadeus - Scrum Master', content: '<h3>Scrum Master</h3><p><b>Amadeus, via ALTEN contractor | Jan 2025 - Present</b></p><p><b>Tools:</b> SAFe, Agile, Jira</p><ul><li>Facilitate daily and weekly work and SAFe ceremonies.</li><li>Coordinate planning with other Scrums, the RTE, Product Manager, System Architect, and Business Owners.</li><li>Ensure Scrum objectives agreed with management are accomplished.</li><li>Lead Quality-topic refinement and reserve resources for technical debt.</li></ul>'},
                {x: 620, y: 150, w: 40, h: 40, title: 'Coding Giants - Coding Teacher', content: '<h3>Coding Teacher</h3><p><b>Coding Giants | Remote | Sep 2023 - Jan 2024</b></p><p><b>Tools:</b> Scratch, Minecraft Education</p><p>Taught coding fundamentals and videogame programming to students aged 7-16 through one-shot classes and structured courses.</p>'}
            ]
        },
        'education': {
            background: '#4c1d95',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 0, y: 200, w: 50, h: 100, hp: 0, maxHp: 100, target: 'hub', label: 'Back', color: '#666', open: true}
            ],
            docs: [
                {x: 180, y: 150, w: 40, h: 40, title: 'Lappeenranta-Lahti University of Technology', content: '<h3>Master of Science in Technology</h3><p><b>Lappeenranta, Finland</b></p><p>Computer Vision and Pattern Recognition within Computational Engineering and Technical Physics.</p><p><b>Topics:</b> Machine Learning, UX Design, GPGPU Computing</p>'},
                {x: 560, y: 150, w: 40, h: 40, title: 'Politecnico di Milano', content: '<h3>Master of Science - Computer Science and Engineering</h3><p><b>Milan, Italy | Grade: 92/110</b></p><p><b>Specialization:</b> Artificial Intelligence</p><p><b>Master Thesis:</b> <a href="https://drive.google.com/file/d/1zclPkAC232IkhAycl-xXkfR6Jo307D3W/view?usp=sharing" target="_blank" style="color: #60a5fa">Human Micro Gesture Recognition by Adversarial Training</a> (Python)</p>'},
                {x: 370, y: 340, w: 40, h: 40, title: 'University of Modena and Reggio Emilia', content: '<h3>Bachelor Degree - Computer Engineering</h3><p><b>Modena, Italy | Grade: 93/110</b></p><p>Department of Engineering "Enzo Ferrari".</p><p><b>Bachelor Thesis:</b> <a href="https://drive.google.com/file/d/1Y-gcaBoKBj2wpza-Gsdh22TtwyI_DkuA/view?usp=sharing" target="_blank" style="color: #60a5fa">Drivers Manager Project</a> (Django)</p>'}
            ]
        },
        'projects': {
            background: '#78350f',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 350, y: 0, w: 100, h: 50, hp: 0, maxHp: 100, target: 'hub', label: 'Back', color: '#666', open: true}
            ],
            docs: [
                {x: 180, y: 250, w: 40, h: 40, title: 'Kiyo and the Unreliable Hero', content: '<h3>Videogame Beta | Sep 2020 - Feb 2021</h3><p><b>Tools:</b> C#, Unity</p><ul><li>Team project with developers, a Game Designer, and a Graphics Designer.</li><li>Developed the beta in a three-month schedule with intermediate milestones.</li><li>Winner of InsertCoin - GameDev Convention 2021 and presented at Comicon 2021 in Naples.</li></ul><p><a href="https://polimi-game-collective.itch.io/kiyo-and-the-unreliable-hero" target="_blank" style="color: #60a5fa">Play on Itch.io</a></p>'},
                {x: 560, y: 250, w: 40, h: 40, title: 'CGRed - Platform Maker with Vulkan', content: '<h3>Videogame Alpha | Apr 2023 - Sep 2023</h3><p><b>Tools:</b> Vulkan, OpenGL</p><p>Team project created to explore Vulkan potential for low-level graphics programming.</p><p><a href="https://youtu.be/1tNf1K6NSZ0" target="_blank" style="color: #60a5fa">Watch the video</a></p>'},
                {x: 370, y: 350, w: 40, h: 40, title: 'Carpool Planner', content: '<h3>Personal Project</h3><p><b>Tools:</b> Python, FastAPI, SQLite, Leaflet</p><p>Designed a self-hosted web app for assigning drivers and passengers, optimizing pickup routes, and collecting trip details through shareable guest links.</p><p><a href="https://github.com/simo-cmos/carpool-planner" target="_blank" style="color: #60a5fa">View on GitHub</a></p>'}
            ]
        },
        'skills': {
            background: '#0c4a6e',
            walls: [
                {x: 0, y: 0, w: 800, h: 50},
                {x: 0, y: 450, w: 800, h: 50},
                {x: 0, y: 0, w: 50, h: 500},
                {x: 750, y: 0, w: 50, h: 500}
            ],
            doors: [
                 {id: 0, x: 750, y: 200, w: 50, h: 100, hp: 0, maxHp: 100, target: 'hub', label: 'Back', color: '#666', open: true}
            ],
            docs: [
                {x: 150, y: 150, w: 40, h: 40, title: 'Advanced Skills', content: '<h3>Tech Stack</h3><ul><li>C++</li><li>Python</li><li>Bash & Git</li><li>C# & Unity</li><li>Agile / SAFe / Jira</li></ul>'},
                {x: 450, y: 150, w: 40, h: 40, title: 'Good Knowledge', content: '<h3>Tools & Technologies</h3><ul><li>Scala</li><li>MongoDB</li><li>CI/CD (Jenkins)</li><li>Cloud</li><li>Scratch</li><li>Rust</li></ul>'},
                {x: 150, y: 350, w: 40, h: 40, title: 'Languages', content: '<h3>Spoken Languages</h3><ul><li>Italian (Native)</li><li>English (C1 Proficient)</li><li>French (B2 Upper-Intermediate)</li></ul>'},
                {x: 450, y: 350, w: 40, h: 40, title: 'Interests', content: '<h3>Hobbies</h3><ul><li>Videogame Design & Programming</li><li>Video Editing</li></ul>'}
            ]
        }
    };

    // --- Input Handling ---
    window.addEventListener('keydown', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') gameState.keys.w = true;
        if (e.key === 'a' || e.key === 'ArrowLeft') gameState.keys.a = true;
        if (e.key === 's' || e.key === 'ArrowDown') gameState.keys.s = true;
        if (e.key === 'd' || e.key === 'ArrowRight') gameState.keys.d = true;
        if (e.key === 'e' || e.key === 'E') {
            if (!gameState.keys.e) { // Trigger only on first press (debounce hold)
                gameState.keys.e = true;
                interact();
            }
        }
        
        // Prevent scrolling with arrows/space if canvas is focused (simplified by checking key)
        if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight", " ", "e", "E"].indexOf(e.key) > -1) {
            // Check if user is typing in some input else prevent default
            // Here we assume game focus, so prevent
             if(document.activeElement === document.body || document.activeElement === canvas) {
                 // e.preventDefault(); // E usually doesn't scroll, but good practice
             }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'w' || e.key === 'ArrowUp') gameState.keys.w = false;
        if (e.key === 'a' || e.key === 'ArrowLeft') gameState.keys.a = false;
        if (e.key === 's' || e.key === 'ArrowDown') gameState.keys.s = false;
        if (e.key === 'd' || e.key === 'ArrowRight') gameState.keys.d = false;
        if (e.key === 'e' || e.key === 'E') gameState.keys.e = false;
    });

    // Mobile Inputs
    function setupMobileBtn(btn, key) {
        if(!btn) return;
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); gameState.mobileKeys[key] = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); gameState.mobileKeys[key] = false; });
        btn.addEventListener('mousedown', (e) => { gameState.mobileKeys[key] = true; });
        btn.addEventListener('mouseup', (e) => { gameState.mobileKeys[key] = false; });
    }
    setupMobileBtn(btnUp, 'w');
    setupMobileBtn(btnDown, 's');
    setupMobileBtn(btnLeft, 'a');
    setupMobileBtn(btnRight, 'd');

    if(btnAttack) {
        btnAttack.addEventListener('touchstart', (e) => { e.preventDefault(); attack(); }); 
        btnAttack.addEventListener('mousedown', (e) => { attack(); });
    }
    if(btnInteract) {
        btnInteract.addEventListener('touchstart', (e) => { e.preventDefault(); interact(); });
        btnInteract.addEventListener('mousedown', (e) => { interact(); });
    }

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        gameState.mouse.x = e.clientX - rect.left;
        gameState.mouse.y = e.clientY - rect.top;
        
        // Update angle only if using mouse (not overriding mobile)
        const dx = gameState.mouse.x - gameState.player.x;
        const dy = gameState.mouse.y - gameState.player.y;
        gameState.player.angle = Math.atan2(dy, dx);
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left Click
            gameState.mouse.leftDown = true;
            attack();
        }
    });
    
    // Check for right click only to NOT prevent default context menu
    // But we don't want game actions on right click
    /*
    canvas.addEventListener('contextmenu', e => {
        // e.preventDefault(); // ALLOW CONTEXT MENU
    });
    */

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) gameState.mouse.leftDown = false;
    });

    // --- Core Logic ---

    function loadLevel(levelName) {
        gameState.currentLevel = levelName;
        // Reset player position based on entry? 
        // For now, center them but offset slightly to avoid immediate exit
        if (levelName === 'hub') {
            gameState.player.x = 400; gameState.player.y = 250;
        } else if (levelName === 'experience') {
            gameState.player.x = 400; gameState.player.y = 380;
        } else if (levelName === 'projects') {
            gameState.player.x = 400; gameState.player.y = 120;
        } else if (levelName === 'education') {
            gameState.player.x = 100; gameState.player.y = 250;
        } else if (levelName === 'skills') {
            gameState.player.x = 700; gameState.player.y = 250;
        }
    }

    function attack() {
        if (gameState.player.attacking) return;
        gameState.player.attacking = true;
        gameState.player.attackTimer = SWORD_SWING_DURATION;

        // Check for door hits
        const level = levels[gameState.currentLevel];
        const attackX = gameState.player.x + Math.cos(gameState.player.angle) * 40;
        const attackY = gameState.player.y + Math.sin(gameState.player.angle) * 40;

        level.doors.forEach(door => {
            if (door.hp > 0) {
                // Simple box collision for attack
                if (attackX > door.x && attackX < door.x + door.w &&
                    attackY > door.y && attackY < door.y + door.h) {
                    
                    door.hp -= SWORD_DAMAGE;
                    createParticles(attackX, attackY, '#fff', 5);
                    
                    if (door.hp <= 0) {
                        door.hp = 0;
                        door.open = true;
                        createParticles(door.x + door.w/2, door.y + door.h/2, door.color, 20);
                    }
                }
            }
        });
    }

    function interact() {
        // If modal is open, close it
        if (gameState.paused) {
            closeModal();
            return;
        }

        const level = levels[gameState.currentLevel];
        // Check for documents nearby
        level.docs.forEach(doc => {
            const dx = gameState.player.x - (doc.x + doc.w/2);
            const dy = gameState.player.y - (doc.y + doc.h/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

             // Check if mouse is near/over (Desktop logic updated)
             // Relaxed logic: If the player is close enough AND aiming near it OR mouse is over it
            const mouseOver = (
                gameState.mouse.x > doc.x && 
                gameState.mouse.x < doc.x + doc.w &&
                gameState.mouse.y > doc.y && 
                gameState.mouse.y < doc.y + doc.h
            );
            
            // Aim check (dot product)
            const angleToDoc = Math.atan2(doc.y + doc.h/2 - gameState.player.y, doc.x + doc.w/2 - gameState.player.x);
            const angleDiff = Math.abs(angleToDoc - gameState.player.angle);
            // Normalized angle diff
            const facing = angleDiff < 1.0 || angleDiff > 5.28; // ~60 degrees cone

            if (dist < 80) {
                 // Open if: Mouse is over OR (Player is close AND facing mostly towards it)
                 // This makes "aiming" with cursor naturally work if cursor is near doc
                if (mouseOver || facing || gameState.mobileKeys.w || gameState.mobileKeys.a || gameState.mobileKeys.s || gameState.mobileKeys.d || true) {
                     openModal(doc.title, doc.content);
                }
            }
        });
    }

    function createParticles(x, y, color, count) {
        for(let i=0; i<count; i++) {
            gameState.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 30,
                color: color
            });
        }
    }

    function checkInteractables() {
        const level = levels[gameState.currentLevel];
        let closestDoc = null;
        let closestDist = 9999;

        level.docs.forEach(doc => {
            const dx = gameState.player.x - (doc.x + doc.w/2);
            const dy = gameState.player.y - (doc.y + doc.h/2);
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 60 && dist < closestDist) {
                closestDist = dist;
                closestDoc = doc;
            }
        });

        gameState.interactableDoc = closestDoc;
    }

    function update() {
        // Player Movement (Merge keyboard and mobile)
        let dx = 0;
        let dy = 0;
        
        const w = gameState.keys.w || gameState.mobileKeys.w;
        const s = gameState.keys.s || gameState.mobileKeys.s;
        const a = gameState.keys.a || gameState.mobileKeys.a;
        const d = gameState.keys.d || gameState.mobileKeys.d;

        if (w) dy -= PLAYER_SPEED;
        if (s) dy += PLAYER_SPEED;
        if (a) dx -= PLAYER_SPEED;
        if (d) dx += PLAYER_SPEED;

        // Auto-orient angle if using mobile keys (since there's no mouse)
        if ((gameState.mobileKeys.w || gameState.mobileKeys.a || gameState.mobileKeys.s || gameState.mobileKeys.d) && (Math.abs(dx) > 0 || Math.abs(dy) > 0)) {
             gameState.player.angle = Math.atan2(dy, dx);
        }

        // Normalize diagonal speed
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        const nextX = gameState.player.x + dx;
        const nextY = gameState.player.y + dy;

        // Reset interactable status each frame
        checkInteractables();

        // Collision Detection (Walls & Closed Doors)
        let canMoveX = true;
        let canMoveY = true;
        const level = levels[gameState.currentLevel];
        const pSize = gameState.player.radius;

        // Check Walls
        level.walls.forEach(wall => {
            if (nextX + pSize > wall.x && nextX - pSize < wall.x + wall.w &&
                gameState.player.y + pSize > wall.y && gameState.player.y - pSize < wall.y + wall.h) {
                canMoveX = false;
            }
            if (gameState.player.x + pSize > wall.x && gameState.player.x - pSize < wall.x + wall.w &&
                nextY + pSize > wall.y && nextY - pSize < wall.y + wall.h) {
                canMoveY = false;
            }
        });

        // Check Doors (Solid if closed, Teleport if open)
        level.doors.forEach(door => {
            // Collision box
            if (nextX + pSize > door.x && nextX - pSize < door.x + door.w &&
                gameState.player.y + pSize > door.y && gameState.player.y - pSize < door.y + door.h) {
                
                if (door.hp > 0 && !door.open) {
                    canMoveX = false; // Solid
                } else if (door.open) {
                    // Enter door -> Switch level
                    loadLevel(door.target);
                    // Force stop this frame update to avoid glitch
                    return; 
                }
            }
            if (gameState.player.x + pSize > door.x && gameState.player.x - pSize < door.x + door.w &&
                nextY + pSize > door.y && nextY - pSize < door.y + door.h) {
                
                 if (door.hp > 0 && !door.open) {
                    canMoveY = false;
                } else if (door.open) {
                     loadLevel(door.target);
                     return;
                }
            }
        });

        if (canMoveX) gameState.player.x += dx;
        if (canMoveY) gameState.player.y += dy;

        // Boundaries
        if (gameState.player.x < pSize) gameState.player.x = pSize;
        if (gameState.player.y < pSize) gameState.player.y = pSize;
        if (gameState.player.x > canvas.width - pSize) gameState.player.x = canvas.width - pSize;
        if (gameState.player.y > canvas.height - pSize) gameState.player.y = canvas.height - pSize;


        // Update Attack
        if (gameState.player.attacking) {
            gameState.player.attackTimer--;
            if (gameState.player.attackTimer <= 0) {
                gameState.player.attacking = false;
            }
        }

        // Update Particles
        for(let i = gameState.particles.length - 1; i >= 0; i--) {
            let p = gameState.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if(p.life <= 0) gameState.particles.splice(i, 1);
        }
    }

    function drawFloor(level) {
        ctx.fillStyle = level.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let x = TILE_SIZE; x < canvas.width; x += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = TILE_SIZE; y < canvas.height; y += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawWall(wall) {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 2;
        ctx.strokeRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2);

        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        if (wall.w >= wall.h) {
            for (let x = wall.x + TILE_SIZE; x < wall.x + wall.w; x += TILE_SIZE) {
                ctx.beginPath();
                ctx.moveTo(x, wall.y);
                ctx.lineTo(x, wall.y + wall.h);
                ctx.stroke();
            }
        } else {
            for (let y = wall.y + TILE_SIZE; y < wall.y + wall.h; y += TILE_SIZE) {
                ctx.beginPath();
                ctx.moveTo(wall.x, y);
                ctx.lineTo(wall.x + wall.w, y);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    function drawDoor(door) {
        const isHorizontal = door.w > door.h;
        const centerX = door.x + door.w / 2;
        const centerY = door.y + door.h / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        if (isHorizontal) ctx.rotate(Math.PI / 2);

        const width = isHorizontal ? door.h : door.w;
        const height = isHorizontal ? door.w : door.h;
        const left = -width / 2;
        const top = -height / 2;

        if (door.hp > 0) {
            ctx.fillStyle = '#171717';
            ctx.fillRect(left, top, width, height);
            ctx.fillStyle = door.color;
            ctx.fillRect(left + 5, top + 4, width - 10, height - 8);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.fillRect(left + 10, top + 12, width - 20, height * 0.34);
            ctx.fillRect(left + 10, top + height * 0.57, width - 20, height * 0.3);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(left + 10, top + 12, width - 20, height * 0.34);
            ctx.strokeRect(left + 10, top + height * 0.57, width - 20, height * 0.3);

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(left + width - 12, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
            ctx.fillRect(left, top, width, height);
            ctx.strokeStyle = door.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(left + 3, top + 3, width - 6, height - 6);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(left + 8, top + 8, width - 16, height - 16);
        }
        ctx.restore();

        if (door.hp > 0) {
            const barY = Math.max(4, door.y - 10);
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(door.x, barY, door.w, 5);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(door.x, barY, door.w * (door.hp / door.maxHp), 5);

            ctx.fillStyle = COLORS.text;
            ctx.font = 'bold 11px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText(door.label, centerX, centerY + 4);
        }
    }

    function drawDocument(doc) {
        const foldSize = 10;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(doc.x, doc.y);
        ctx.lineTo(doc.x + doc.w - foldSize, doc.y);
        ctx.lineTo(doc.x + doc.w, doc.y + foldSize);
        ctx.lineTo(doc.x + doc.w, doc.y + doc.h);
        ctx.lineTo(doc.x, doc.y + doc.h);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(doc.x + doc.w - foldSize, doc.y);
        ctx.lineTo(doc.x + doc.w - foldSize, doc.y + foldSize);
        ctx.lineTo(doc.x + doc.w, doc.y + foldSize);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(doc.x + 6, doc.y + 7, 15, 4);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(doc.x + 6, doc.y + 16, doc.w - 12, 2);
        ctx.fillRect(doc.x + 6, doc.y + 22, doc.w - 12, 2);
        ctx.fillRect(doc.x + 6, doc.y + 28, doc.w - 19, 2);
        ctx.strokeStyle = '#dbeafe';
        ctx.lineWidth = 1;
        ctx.strokeRect(doc.x + 0.5, doc.y + 0.5, doc.w - 1, doc.h - 1);
    }

    function drawSword(length) {
        ctx.save();

        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, -3, 12, 6);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(14, -8, 5, 16);
        ctx.beginPath();
        ctx.arc(4, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        const bladeStart = 19;
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(bladeStart, -5);
        ctx.lineTo(length - 8, -5);
        ctx.lineTo(length, 0);
        ctx.lineTo(length - 8, 5);
        ctx.lineTo(bladeStart, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(bladeStart + 3, -2);
        ctx.lineTo(length - 9, -2);
        ctx.stroke();
        ctx.restore();
    }

    function draw() {
        const level = levels[gameState.currentLevel];
        
        drawFloor(level);

        // Draw Walls
        level.walls.forEach(wall => {
            drawWall(wall);
        });

        // Draw Doors
        level.doors.forEach(door => {
            drawDoor(door);
        });

        // Draw Documents
        level.docs.forEach(doc => {
            // Highlight if interactable
            if (gameState.interactableDoc === doc) {
                ctx.strokeStyle = '#fbbf24'; // Amber
                ctx.lineWidth = 3;
                ctx.strokeRect(doc.x - 2, doc.y - 2, doc.w + 4, doc.h + 4);
                
                // Prompt
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText("Press E", doc.x + doc.w/2, doc.y - 20);
            }

            drawDocument(doc);
        });

        // Draw Player
        ctx.save();
        ctx.translate(gameState.player.x, gameState.player.y);
        ctx.rotate(gameState.player.angle);

        // Body
        ctx.fillStyle = gameState.player.color;
        ctx.beginPath();
        ctx.arc(0, 0, gameState.player.radius, 0, Math.PI * 2);
        ctx.fill();

        if (gameState.player.attacking) {
            // Swing animation
            const progress = 1 - (gameState.player.attackTimer / SWORD_SWING_DURATION);
            const swingAngle = -Math.PI/3 + (progress * Math.PI * 2/3); // -60deg to +60deg
            
            ctx.rotate(swingAngle);
            drawSword(52);
            ctx.rotate(-swingAngle);
        } else {
            ctx.rotate(Math.PI / 8);
            drawSword(36);
        }

        ctx.restore();

        // Draw Particles
        gameState.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        
        // Area Text
        ctx.fillStyle = COLORS.text;
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Area: ${gameState.currentLevel.toUpperCase()}`, 10, 20);
    }

    function gameLoop() {
        if (!gameState.paused) {
            update();
            draw();
        }
        requestAnimationFrame(gameLoop);
    }

    // --- Modal Logic ---
    function openModal(title, content) {
        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.style.display = 'flex';
        gameState.paused = true;
    }

    function closeModal() {
        modal.style.display = 'none';
        gameState.paused = false;
    }

    closeBtn.addEventListener('click', () => {
        closeModal();
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Start
    gameLoop();
});
