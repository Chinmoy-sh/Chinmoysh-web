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

    // --- 2. Lightweight Particle Network Animation ---
    const canvas = document.getElementById('networkCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const connectionDistance = 110;
    const connectionDistanceSquared = connectionDistance * connectionDistance;
    const nodeColor = '14, 165, 233';
    const mouse = { x: null, y: null, radius: 140 };
    const particles = [];
    let width = 0;
    let height = 0;
    let animationFrame;
    let resizeFrame;
    let lastFrameTime = 0;
    let isPageVisible = !document.hidden;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 1.0;
            this.vy = (Math.random() - 0.5) * 1.0;
            this.radius = Math.random() * 1.5 + 1.75;
        }

        update(delta) {
            this.x += this.vx * delta;
            this.y += this.vy * delta;

            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;

            if (mouse.x !== null && mouse.y !== null) {
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < mouse.radius * mouse.radius && distanceSquared > 0) {
                    const distance = Math.sqrt(distanceSquared);
                    const force = (mouse.radius - distance) / mouse.radius;
                    this.x += (dx / distance) * force * delta * 0.09;
                    this.y += (dy / distance) * force * delta * 0.09;
                }
            }
        }
    }

    function initParticles() {
        particles.length = 0;
        const area = width * height;
        const particleCount = Math.min(120, Math.max(36, Math.round(area / 11000)));

        for (let index = 0; index < particleCount; index += 1) {
            particles.push(new Particle());
        }
    }

    function resize() {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            const nextWidth = window.innerWidth;
            const nextHeight = window.innerHeight;

            width = nextWidth;
            height = nextHeight;
            canvas.width = Math.round(width * pixelRatio);
            canvas.height = Math.round(height * pixelRatio);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
            initParticles();
        });
    }

    function updatePointer(clientX, clientY) {
        mouse.x = clientX;
        mouse.y = clientY;
    }

    function clearPointer() {
        mouse.x = null;
        mouse.y = null;
    }

    function draw(timestamp) {
        if (!isPageVisible) return;

        const elapsed = lastFrameTime ? Math.min(timestamp - lastFrameTime, 32) : 16;
        const delta = elapsed / 16.67;
        lastFrameTime = timestamp;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(14, 165, 233, 0.9)';
        ctx.strokeStyle = `rgba(${nodeColor}, 0.35)`;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 1.4;
        ctx.beginPath();

        for (const particle of particles) {
            if (!reducedMotion) particle.update(delta);
            ctx.moveTo(particle.x + particle.radius, particle.y);
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        }
        ctx.fill();

        for (let index = 0; index < particles.length; index += 1) {
            const current = particles[index];

            for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
                const next = particles[nextIndex];
                const dx = current.x - next.x;
                const dy = current.y - next.y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < connectionDistanceSquared) {
                    const proximity = 1 - Math.sqrt(distanceSquared) / connectionDistance;
                    const opacity = 0.14 + proximity * 0.62;
                    ctx.strokeStyle = `rgba(${nodeColor}, ${opacity})`;
                    ctx.lineWidth = 0.85 + proximity * 1.35;
                    ctx.beginPath();
                    ctx.moveTo(current.x, current.y);
                    ctx.lineTo(next.x, next.y);
                    ctx.stroke();
                }
            }

            if (mouse.x !== null && mouse.y !== null) {
                const dx = current.x - mouse.x;
                const dy = current.y - mouse.y;
                const distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < mouse.radius * mouse.radius) {
                    const proximity = 1 - Math.sqrt(distanceSquared) / mouse.radius;
                    ctx.strokeStyle = `rgba(${nodeColor}, ${0.16 + proximity * 0.72})`;
                    ctx.lineWidth = 1.4 + proximity * 1.2;
                    ctx.beginPath();
                    ctx.moveTo(current.x, current.y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.stroke();
                }
            }
        }

        if (!reducedMotion) {
            animationFrame = requestAnimationFrame(draw);
        }
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', (event) => updatePointer(event.clientX, event.clientY), { passive: true });
    window.addEventListener('pointerleave', clearPointer, { passive: true });
    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
        if (isPageVisible && !reducedMotion) {
            lastFrameTime = 0;
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(draw);
        } else {
            cancelAnimationFrame(animationFrame);
        }
    });

    resize();
    animationFrame = requestAnimationFrame(draw);
});
