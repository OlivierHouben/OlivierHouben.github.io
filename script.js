// Remplace par tes propres URL et clé anon de Supabase !
const SUPABASE_URL = 'https://oqzodloceehlylgisewb.supabase.co'; // Assure-toi qu'elle est EXACTEMENT correcte
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xem9kbG9jZWVobHlsZ2lzZXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDE0NzMsImV4cCI6MjA2MjM3NzQ3M30.pN9V-cpQXlRKUAq7Khmn__ePJBKeR3x5o35MGvqIqvE'; // Assure-toi qu'elle est EXACTEMENT correcte

// 2. Variables Globales et Éléments du DOM
let supabaseClient;
const lockersContainer = document.getElementById('lockers-container');
let lastUpdatedLockerId = null; // Pour suivre le dernier casier mis à jour pour l'animation

// Optionnel: Activer AutoAnimate si la librairie est chargée
// if (lockersContainer && typeof autoAnimate === 'function') {
//     autoAnimate(lockersContainer);
// }

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

// 4. Fonctions Principales

/**
 * Récupère les casiers depuis Supabase et les affiche dans le DOM avec animations.
 */
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
            lockersContainer.innerHTML = ''; // Vider avant d'ajouter
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

                lockerDiv.innerHTML = `
                    <h3>Casier ${locker.name}</h3>
                    <p>Statut: <span class="status-text">${statusText}</span></p>
                    ${locker.size ? `<p>Taille: ${locker.size}</p>` : ''}
                    ${locker.location_description ? `<p>Lieu: ${locker.location_description}</p>` : ''}
                    ${buttonHtml}
                `;
                lockersContainer.appendChild(lockerDiv);

                // Animation d'apparition
                setTimeout(() => {
                    lockerDiv.classList.add('is-visible');
                    // Appliquer l'animation de feedback si c'est le casier qui vient d'être mis à jour
                    if (lastUpdatedLockerId && locker.id == lastUpdatedLockerId) {
                        lockerDiv.classList.add('feedback-animation');
                        lockerDiv.addEventListener('animationend', () => {
                            lockerDiv.classList.remove('feedback-animation');
                        }, { once: true });
                        lastUpdatedLockerId = null; // Réinitialiser pour la prochaine fois
                    }
                }, index * 70 + 50); // Délai progressif pour un effet "cascade"
            });
        } else {
            lockersContainer.innerHTML = '<p>Aucun casier trouvé.</p>';
        }
    } catch (err) {
        console.error('Erreur inattendue dans fetchAndDisplayLockers:', err);
        lockersContainer.innerHTML = '<p style="color: red;">Erreur inattendue lors de l\'affichage.</p>';
    }
}

/**
 * Met à jour le statut d'un casier spécifique dans Supabase.
 * @param {string|number} lockerId - L'ID du casier.
 * @param {string} newStatus - Le nouveau statut.
 * @returns {Promise<boolean>} - true si succès, false sinon.
 */
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
        lastUpdatedLockerId = lockerId; // Noter l'ID pour l'animation de feedback
        return true;
    } catch (err) {
        console.error('Erreur inattendue mise à jour casier:', err);
        alert('Erreur inattendue lors de la mise à jour.');
        return false;
    }
}

/**
 * Gère les clics sur les boutons d'action.
 * @param {Event} event - L'objet événement du clic.
 */
async function handleActionButtonClick(event) {
    if (!event.target.classList.contains('action-button')) return;

    const lockerDiv = event.target.closest('.locker');
    if (!lockerDiv) return;

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
        // Au lieu d'animer ici directement, on note l'ID et fetchAndDisplayLockers
        // s'occupera d'appliquer l'animation de feedback au bon élément après recréation.
        fetchAndDisplayLockers();
    }
}

// 5. Écouteurs d'Événements
if (lockersContainer) {
    lockersContainer.addEventListener('click', handleActionButtonClick);
} else {
    console.error("L'élément 'lockers-container' non trouvé pour l'écouteur d'événements.");
}