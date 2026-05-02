document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Dynamic UTC Clock ---
    function updateClock() {
        const now = new Date();
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        const clockElement = document.getElementById('currentTime');
        if (clockElement) {
            clockElement.textContent = `${hours}:${minutes}:${seconds} UTC`;
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- 2. Particle Network Animation ---
    const canvas = document.getElementById('networkCanvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let w, h;

    // Manage screen resize with debouncing to save performance
    let resizeTimer;
    function resize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            initParticles();
        }, 100);
    }
    window.addEventListener('resize', resize);

    // Interaction State Tracking
    const mouse = { x: null, y: null, radius: 140 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Mobile Touch Support
    window.addEventListener('touchmove', (e) => {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    });
    window.addEventListener('touchend', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle Class Definitions
    class Particle {
        constructor() {
            this.x = Math.random() * w;
            this.y = Math.random() * h;
            this.vx = (Math.random() - 0.5) * 1.0;
            this.vy = (Math.random() - 0.5) * 1.0;
            this.radius = Math.random() * 2 + 1.5;
        }

        update() {
            // Update Positions
            this.x += this.vx;
            this.y += this.vy;

            // Deflect particles off the screen boundaries
            if (this.x < 0 || this.x > w) this.vx = -this.vx;
            if (this.y < 0 || this.y > h) this.vy = -this.vy;

            // Apply mouse interaction (gentle repulsion)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;

                    // Push away gently
                    this.x += forceDirectionX * force * 1.5;
                    this.y += forceDirectionY * force * 1.5;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(14, 165, 233, 0.9)'; // Tailwind Sky-500
            ctx.fill();
        }
    }

    // Initialization logic
    function initParticles() {
        particlesArray = [];
        // Scale particle count dynamically based on screen real estate
        let numberOfParticles = (w * h) / 10000;
        // Place a cap to prevent lag on extra-large monitors
        if (numberOfParticles > 120) numberOfParticles = 120;

        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }

    // Render/Animation Loop
    function animate() {
        ctx.clearRect(0, 0, w, h);

        // Update and draw each particle
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();

            // Calculate Particle-to-Particle connections
            for (let j = i; j < particlesArray.length; j++) {
                let dx = particlesArray[i].x - particlesArray[j].x;
                let dy = particlesArray[i].y - particlesArray[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 110) {
                    ctx.beginPath();
                    // Glow/opacity relative to distance
                    ctx.strokeStyle = `rgba(14, 165, 233, ${1 - distance / 110})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                }
            }

            // Draw Interactive "Grab" lines from Mouse to Particle
            if (mouse.x !== null && mouse.y !== null) {
                let dx = particlesArray[i].x - mouse.x;
                let dy = particlesArray[i].y - mouse.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(14, 165, 233, ${1 - distance / mouse.radius})`;
                    ctx.lineWidth = 1.2;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    // Start up
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    initParticles();
    animate();
});