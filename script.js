// Remplace par tes propres URL et clé anon de Supabase !
const SUPABASE_URL = 'https://oqzodloceehlylgisewb.supabase.co'; // Assure-toi qu'elle est EXACTEMENT correcte
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xem9kbG9jZWVobHlsZ2lzZXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDE0NzMsImV4cCI6MjA2MjM3NzQ3M30.pN9V-cpQXlRKUAq7Khmn__ePJBKeR3x5o35MGvqIqvE'; // Assure-toi qu'elle est EXACTEMENT correcte

// 2. Variables Globales et Éléments du DOM
let supabaseClient;
const lockersContainer = document.getElementById('lockers-container');
let lastUpdatedLockerId = null;

// 3. Initialisation du Client Supabase et Premier Chargement
try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialisé avec succès.');
    fetchAndDisplayLockers();
} catch (error) {
    console.error('Erreur lors de l\'initialisation de Supabase:', error);
    if (lockersContainer) {
        lockersContainer.innerHTML = '<p style="color: red;">Erreur de connexion à la base de données. Vérifiez la console (F12).</p>';
    }
}

// 4. Classe pour les Particules de Feu
class FireParticle {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4; // Taille ajustée
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * -2.5 - 1.5; // Un peu plus rapide vers le haut
        this.colorStops = [
            { stop: 0, color: 'rgba(255, 255, 220, 1)' }, // Blanc-Jaune très chaud
            { stop: 0.15, color: 'rgba(255, 200, 0, 1)' }, // Jaune-Orange
            { stop: 0.5, color: 'rgba(255, 100, 0, 0.8)' }, // Orange-Rouge
            { stop: 0.9, color: 'rgba(150, 0, 0, 0.3)' },   // Rouge sombre
            { stop: 1, color: 'rgba(50, 50, 50, 0.1)' }     // Fumée
        ];
        this.life = Math.random() * 50 + 40; // Durée de vie ajustée
        this.initialLife = this.life;
        this.alpha = 0.9; // Commencer un peu transparent
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY *= 0.98; // Ralentissement vertical pour un effet plus "flottant"

        this.speedX += (Math.random() - 0.5) * 0.3;
        if (this.speedX > 1.5) this.speedX = 1.5;
        if (this.speedX < -1.5) this.speedX = -1.5;

        this.life -= 1;
        this.alpha = Math.max(0, (this.life / this.initialLife) * 0.9);

        if (this.size > 0.15) this.size -= 0.1;
    }

    draw(ctx) {
        if (this.life <= 0 || this.size <= 0.15) return;

        const lifeRatio = 1 - (this.life / this.initialLife);
        let currentColor = 'rgba(0,0,0,0)'; // Transparent par défaut

        for (let i = 0; i < this.colorStops.length - 1; i++) {
            if (lifeRatio >= this.colorStops[i].stop && lifeRatio <= this.colorStops[i+1].stop) {
                const t = (lifeRatio - this.colorStops[i].stop) / (this.colorStops[i+1].stop - this.colorStops[i].stop);
                const r1 = parseInt(this.colorStops[i].color.match(/\d+/g)[0]);
                const g1 = parseInt(this.colorStops[i].color.match(/\d+/g)[1]);
                const b1 = parseInt(this.colorStops[i].color.match(/\d+/g)[2]);
                const a1 = parseFloat(this.colorStops[i].color.match(/[\d\.]+/g)[3]);
                const r2 = parseInt(this.colorStops[i+1].color.match(/\d+/g)[0]);
                const g2 = parseInt(this.colorStops[i+1].color.match(/\d+/g)[1]);
                const b2 = parseInt(this.colorStops[i+1].color.match(/\d+/g)[2]);
                const a2 = parseFloat(this.colorStops[i+1].color.match(/[\d\.]+/g)[3]);
                const r = Math.round(r1 + (r2 - r1) * t);
                const g = Math.round(g1 + (g2 - g1) * t);
                const b = Math.round(b1 + (b2 - b1) * t);
                const a = a1 + (a2 - a1) * t;
                currentColor = `rgba(${r},${g},${b},${this.alpha * a})`;
                break;
            }
        }
        if (lifeRatio > this.colorStops[this.colorStops.length - 2].stop) { // Pour la dernière couleur (fumée)
             currentColor = this.colorStops[this.colorStops.length - 1].color.replace(/[\d\.]+\)$/g, `${this.alpha * parseFloat(this.colorStops[this.colorStops.length - 1].color.match(/[\d\.]+/g)[3])})`);
        }


        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = currentColor;
        ctx.shadowBlur = Math.max(5, this.size);
        ctx.shadowColor = currentColor.replace(/[\d\.]+\)$/g, `${this.alpha * 0.4})`);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// 5. Gestionnaire d'Animation de Feu pour un Canvas
function animateFire(canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;
    let isActive = false;
    const PARTICLE_EMIT_COUNT = 2; // Nombre de particules à émettre par frame d'émission

    function resizeCanvas() {
        // S'assurer que le canvas a les bonnes dimensions par rapport à son conteneur CSS
        // Cela évite les déformations si la taille du casier change.
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }

    function emitParticles() {
        if (!isActive) return;
        for (let i = 0; i < PARTICLE_EMIT_COUNT; i++) {
            const emitterX = canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.5);
            particles.push(new FireParticle(emitterX, canvas.height - 5, canvas.width, canvas.height));
        }
    }

    function loop() {
        if (!isActive && particles.length === 0) {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            return;
        }

        // Effacer avec un léger fondu pour un effet de traînée
        ctx.globalCompositeOperation = 'source-over'; // Mode de dessin normal
        ctx.fillStyle = 'rgba(30, 10, 0, 0.12)'; // Couleur de fond sombre pour l'effet de feu, alpha contrôle la traînée
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.globalCompositeOperation = 'lighter'; // Les particules lumineuses s'additionnent

        emitParticles();

        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw(ctx);
            if (particles[i].life <= 0 || particles[i].size <= 0.15) {
                particles.splice(i, 1);
            }
        }
        animationFrameId = requestAnimationFrame(loop);
    }

    canvas.startFire = () => {
        if (isActive && animationFrameId) return;
        isActive = true;
        resizeCanvas(); // S'assurer des bonnes dimensions avant de démarrer
        if (!animationFrameId) {
            loop();
        }
    };

    canvas.stopFire = () => {
        isActive = false;
    };

    // Observer les changements de taille du casier pour redimensionner le canvas
    // Ceci est une approche simple, ResizeObserver serait plus robuste.
    // Pour l'instant, on redimensionne au démarrage de l'effet.
}


// 6. Fonctions Principales de l'Application (fetchAndDisplayLockers, etc.)

async function fetchAndDisplayLockers() {
    if (!supabaseClient) {
        console.error('Supabase client non initialisé.');
        if (lockersContainer) lockersContainer.innerHTML = '<p style="color: red;">Client Supabase non prêt.</p>';
        return;
    }

    if (lockersContainer) {
        lockersContainer.innerHTML = '<p>Chargement des casiers...</p>';
    } else {
        console.error("L'élément 'lockers-container' n'a pas été trouvé.");
        return;
    }

    try {
        let { data: lockers, error } = await supabaseClient
            .from('lockers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erreur lors de la récupération des casiers:', error);
            lockersContainer.innerHTML = `<p style="color: red;">Erreur chargement: ${error.message}</p>`;
            return;
        }

        if (lockers && lockers.length > 0) {
            lockersContainer.innerHTML = '';
            lockers.forEach((locker, index) => {
                const lockerDiv = document.createElement('div');
                lockerDiv.classList.add('locker', locker.status);
                lockerDiv.setAttribute('data-id', locker.id);

                const statusText = locker.status === 'available' ? 'Disponible' :
                                   locker.status === 'reserved' ? 'Réservé' :
                                   locker.status === 'out_of_service' ? 'Hors Service' :
                                   locker.status;

                const buttonText = locker.status === 'available' ? 'Réserver' : 'Libérer';
                const buttonHtml = locker.status !== 'out_of_service' ?
                    `<button class="action-button">${buttonText}</button>` : '';

                const fireCanvas = document.createElement('canvas');
                fireCanvas.classList.add('fire-canvas');

                lockerDiv.innerHTML = `
                    <h3>Casier ${locker.name}</h3>
                    <p>Statut: <span class="status-text">${statusText}</span></p>
                    ${locker.size ? `<p>Taille: ${locker.size}</p>` : ''}
                    ${locker.location_description ? `<p>Lieu: ${locker.location_description}</p>` : ''}
                    ${buttonHtml}
                `;
                lockerDiv.appendChild(fireCanvas);
                lockersContainer.appendChild(lockerDiv);

                animateFire(fireCanvas); // Initialiser l'animation de feu pour ce canvas

                lockerDiv.addEventListener('mouseenter', () => {
                    if (fireCanvas.startFire && !lockerDiv.classList.contains('feedback-animation')) {
                         // Ne pas démarrer le feu si une animation de feedback est en cours
                        fireCanvas.startFire();
                    }
                });
                lockerDiv.addEventListener('mouseleave', () => {
                    if (fireCanvas.stopFire) fireCanvas.stopFire();
                });

                setTimeout(() => {
                    lockerDiv.classList.add('is-visible');
                    if (lastUpdatedLockerId && locker.id == lastUpdatedLockerId) {
                        lockerDiv.classList.add('feedback-animation');
                        // Cacher le feu pendant l'animation de feedback si elle est active
                        if (fireCanvas.stopFire) fireCanvas.stopFire();
                        const tempCanvas = lockerDiv.querySelector('.fire-canvas');
                        if(tempCanvas) tempCanvas.style.opacity = '0';


                        lockerDiv.addEventListener('animationend', () => {
                            lockerDiv.classList.remove('feedback-animation');
                            if(tempCanvas) tempCanvas.style.opacity = ''; // Rétablir l'opacité gérée par CSS
                        }, { once: true });
                        lastUpdatedLockerId = null;
                    }
                }, index * 70 + 50);
            });
        } else {
            lockersContainer.innerHTML = '<p>Aucun casier trouvé.</p>';
        }
    } catch (err) {
        console.error('Erreur inattendue dans fetchAndDisplayLockers:', err);
        lockersContainer.innerHTML = '<p style="color: red;">Erreur inattendue lors de l\'affichage.</p>';
    }
}

async function updateLockerStatus(lockerId, newStatus) {
    if (!supabaseClient) {
        console.error('Supabase client non initialisé.');
        return false;
    }
    try {
        const updateData = { status: newStatus };
        const { data, error } = await supabaseClient
            .from('lockers')
            .update(updateData)
            .eq('id', lockerId)
            .select();

        if (error) {
            console.error('Erreur mise à jour casier:', error);
            alert(`Erreur mise à jour: ${error.message}`);
            return false;
        }
        console.log('Casier mis à jour:', data);
        lastUpdatedLockerId = lockerId;
        return true;
    } catch (err) {
        console.error('Erreur inattendue mise à jour casier:', err);
        alert('Erreur inattendue lors de la mise à jour.');
        return false;
    }
}

async function handleActionButtonClick(event) {
    if (!event.target.classList.contains('action-button')) return;

    const lockerDiv = event.target.closest('.locker');
    if (!lockerDiv) return;

    // Arrêter l'effet de feu si le bouton est cliqué
    const fireCanvas = lockerDiv.querySelector('.fire-canvas');
    if (fireCanvas && fireCanvas.stopFire) {
        fireCanvas.stopFire();
        // Forcer l'opacité à 0 rapidement pour que le feedback soit plus clair
        fireCanvas.style.transition = 'opacity 0.1s ease-out';
        fireCanvas.style.opacity = '0';
        setTimeout(() => { // Rétablir la transition normale
             if(fireCanvas) fireCanvas.style.transition = '';
        }, 150);
    }


    const lockerId = lockerDiv.dataset.id;
    const lockerName = lockerDiv.querySelector('h3').textContent;
    const isCurrentlyAvailable = lockerDiv.classList.contains('available');
    let success = false;

    if (isCurrentlyAvailable) {
        if (confirm(`Voulez-vous vraiment réserver le ${lockerName} ?`)) {
            success = await updateLockerStatus(lockerId, 'reserved');
        }
    } else {
        if (confirm(`Voulez-vous vraiment libérer le ${lockerName} ?`)) {
            success = await updateLockerStatus(lockerId, 'available');
        }
    }

    if (success) {
        fetchAndDisplayLockers();
    }
}

// 7. Écouteurs d'Événements
if (lockersContainer) {
    lockersContainer.addEventListener('click', handleActionButtonClick);
} else {
    console.error("L'élément 'lockers-container' n'a pas été trouvé pour l'écouteur d'événements.");
}