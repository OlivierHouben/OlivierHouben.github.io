// Remplace par tes propres URL et clé anon de Supabase !
const SUPABASE_URL = 'https://oqzodloceehlylgisewb.supabase.co'; // Assure-toi qu'elle est EXACTEMENT correcte
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xem9kbG9jZWVobHlsZ2lzZXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDE0NzMsImV4cCI6MjA2MjM3NzQ3M30.pN9V-cpQXlRKUAq7Khmn__ePJBKeR3x5o35MGvqIqvE'; // Assure-toi qu'elle est EXACTEMENT correcte

// 2. Variables Globales et Éléments du DOM
let supabaseClient; // Contiendra l'instance du client Supabase
const lockersContainer = document.getElementById('lockers-container');

// 3. Initialisation du Client Supabase et Premier Chargement
try {
    // 'supabase' ici est l'objet global fourni par le CDN de Supabase.
    // Sa méthode .createClient() retourne une instance client.
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialisé avec succès.');

    // Maintenant que le client est initialisé, on peut charger les casiers
    fetchAndDisplayLockers();

} catch (error) {
    console.error('Erreur lors de l\'initialisation de Supabase:', error);
    if (lockersContainer) {
        lockersContainer.innerHTML = '<p style="color: red;">Erreur de connexion à la base de données. Vérifiez la console pour plus de détails (F12).</p>';
    }
}

// 4. Fonctions Principales

/**
 * Récupère les casiers depuis Supabase et les affiche dans le DOM.
 */
async function fetchAndDisplayLockers() {
    if (!supabaseClient) {
        console.error('Supabase client non initialisé avant fetchAndDisplayLockers.');
        if (lockersContainer) {
            lockersContainer.innerHTML = '<p style="color: red;">Client Supabase non prêt.</p>';
        }
        return;
    }

    if (lockersContainer) {
        lockersContainer.innerHTML = '<p>Chargement des casiers...</p>';
    } else {
        console.error("L'élément 'lockers-container' n'a pas été trouvé dans le DOM.");
        return;
    }

    try {
        // 'lockers' est le nom de ta table dans Supabase
        let { data: lockers, error } = await supabaseClient
            .from('lockers')
            .select('*') // Récupère toutes les colonnes
            .order('name', { ascending: true }); // Trie les casiers par nom

        if (error) {
            console.error('Erreur lors de la récupération des casiers:', error);
            lockersContainer.innerHTML = `<p style="color: red;">Erreur lors du chargement des casiers: ${error.message}</p>`;
            return;
        }

        if (lockers && lockers.length > 0) {
            lockersContainer.innerHTML = ''; // Vider le conteneur avant d'ajouter les nouveaux éléments
            lockers.forEach(locker => {
                const lockerDiv = document.createElement('div');
                lockerDiv.classList.add('locker', locker.status); // Ajoute la classe 'available' ou 'reserved'
                lockerDiv.setAttribute('data-id', locker.id);    // Stocke l'ID du casier pour référence future

                const statusText = locker.status === 'available' ? 'Disponible' :
                                   locker.status === 'reserved' ? 'Réservé' :
                                   locker.status === 'out_of_service' ? 'Hors Service' :
                                   locker.status; // Au cas où il y aurait d'autres statuts

                const buttonText = locker.status === 'available' ? 'Réserver' : 'Libérer';
                // On ne met pas de bouton si 'out_of_service'
                const buttonHtml = locker.status !== 'out_of_service' ?
                    `<button class="action-button">${buttonText}</button>` :
                    '';

                lockerDiv.innerHTML = `
                    <h3>Casier ${locker.name}</h3>
                    <p>Statut: <span class="status-text">${statusText}</span></p>
                    ${locker.size ? `<p>Taille: ${locker.size}</p>` : ''}
                    ${locker.location_description ? `<p>Lieu: ${locker.location_description}</p>` : ''}
                    ${buttonHtml}
                `;
                lockersContainer.appendChild(lockerDiv);
            });
        } else {
            lockersContainer.innerHTML = '<p>Aucun casier trouvé.</p>';
        }
    } catch (err) {
        console.error('Erreur inattendue dans fetchAndDisplayLockers:', err);
        lockersContainer.innerHTML = '<p style="color: red;">Une erreur inattendue est survenue lors de l\'affichage des casiers.</p>';
    }
}

/**
 * Met à jour le statut d'un casier spécifique dans Supabase.
 * @param {string|number} lockerId - L'ID du casier à mettre à jour.
 * @param {string} newStatus - Le nouveau statut ('available' ou 'reserved').
 * @returns {Promise<boolean>} - true si la mise à jour a réussi, false sinon.
 */
async function updateLockerStatus(lockerId, newStatus) {
    if (!supabaseClient) {
        console.error('Supabase client non initialisé avant updateLockerStatus.');
        return false;
    }

    try {
        // Pour l'instant, la réservation est anonyme.
        // Plus tard, on pourrait ajouter `reserved_by_user_id` et `reserved_until`.
        const updateData = { status: newStatus };
        if (newStatus === 'available') {
            // Optionnel: réinitialiser les champs de réservation quand on libère
            // updateData.reserved_by_user_id = null;
            // updateData.reserved_until = null;
        }

        const { data, error } = await supabaseClient
            .from('lockers')
            .update(updateData)
            .eq('id', lockerId) // Conditionne la mise à jour à cet ID spécifique
            .select();          // Optionnel: retourne la/les ligne(s) modifiée(s)

        if (error) {
            console.error('Erreur lors de la mise à jour du casier:', error);
            alert(`Erreur lors de la mise à jour: ${error.message}`);
            return false;
        }

        console.log('Casier mis à jour avec succès:', data);
        return true;

    } catch (err) {
        console.error('Erreur inattendue lors de la mise à jour du casier:', err);
        alert('Une erreur inattendue est survenue lors de la mise à jour.');
        return false;
    }
}

/**
 * Gère les clics sur les boutons d'action (Réserver/Libérer).
 * @param {Event} event - L'objet événement du clic.
 */
async function handleActionButtonClick(event) {
    // Vérifier si l'élément cliqué est bien un bouton d'action
    if (!event.target.classList.contains('action-button')) {
        return; // Ce n'est pas le bon bouton, ne rien faire
    }

    const lockerDiv = event.target.closest('.locker'); // Trouve l'élément parent '.locker'
    if (!lockerDiv) return;

    const lockerId = lockerDiv.dataset.id;
    const lockerName = lockerDiv.querySelector('h3').textContent; // Pour le message de confirmation

    // Détermine l'action basée sur le statut actuel (classe CSS)
    const isCurrentlyAvailable = lockerDiv.classList.contains('available');
    let success = false;

    if (isCurrentlyAvailable) {
        if (confirm(`Voulez-vous vraiment réserver le ${lockerName} ?`)) {
            success = await updateLockerStatus(lockerId, 'reserved');
        }
    } else { // Actuellement réservé, donc on veut libérer
        if (confirm(`Voulez-vous vraiment libérer le ${lockerName} ?`)) {
            success = await updateLockerStatus(lockerId, 'available');
        }
    }

    if (success) {
        // Si la mise à jour a réussi, recharger la liste des casiers pour refléter les changements
        fetchAndDisplayLockers();
    }
}

// 5. Écouteurs d'Événements
// Ajouter un écouteur d'événements global sur le conteneur des casiers
// pour gérer les clics sur les boutons d'action (délégation d'événements).
if (lockersContainer) {
    lockersContainer.addEventListener('click', handleActionButtonClick);
} else {
    // Ce message s'affichera si le script est exécuté avant que 'lockers-container' ne soit dans le DOM,
    // ou si l'ID est incorrect dans index.html.
    console.error("L'élément 'lockers-container' n'a pas été trouvé au moment d'ajouter l'écouteur d'événements.");
}