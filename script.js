// Remplace par tes propres URL et clé anon de Supabase !
const SUPABASE_URL = 'https://oqzodloceehlylgisewb.supabase.co'; // Assure-toi qu'elle est EXACTEMENT correcte
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xem9kbG9jZWVobHlsZ2lzZXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDE0NzMsImV4cCI6MjA2MjM3NzQ3M30.pN9V-cpQXlRKUAq7Khmn__ePJBKeR3x5o35MGvqIqvE'; // Assure-toi qu'elle est EXACTEMENT correcte

// 'supabase' ici est l'objet global fourni par le CDN
// Nous allons stocker notre instance client dans une variable, par exemple 'supabaseClient'
let supabaseClient; // Ou tu peux l'appeler 'supabase' mais c'est pour éviter la confusion initiale

const lockersContainer = document.getElementById('lockers-container');

try {
    // 'supabase' à droite est l'objet global du CDN.
    // Sa méthode .createClient() retourne une instance client.
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialisé.');

    // Maintenant que le client est initialisé, on peut charger les casiers
    fetchAndDisplayLockers();

} catch (error) {
    console.error('Erreur initialisation Supabase:', error); // REGARDE CETTE ERREUR DANS LA CONSOLE !
    if (lockersContainer) {
        lockersContainer.innerHTML = '<p>Erreur de connexion à la base de données. Vérifiez la console pour plus de détails.</p>';
    }
}

// Fonction pour récupérer et afficher les casiers
async function fetchAndDisplayLockers() {
    if (!supabaseClient) { // Vérifier si supabaseClient est bien initialisé
        console.error('Supabase client non initialisé avant fetchAndDisplayLockers.');
        if (lockersContainer) {
            lockersContainer.innerHTML = '<p>Client Supabase non prêt.</p>';
        }
        return;
    }

    lockersContainer.innerHTML = '<p>Chargement des casiers...</p>';

    try {
        let { data: lockers, error } = await supabaseClient // Utilise supabaseClient ici
            .from('lockers')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('Erreur lors de la récupération des casiers:', error); // REGARDE CETTE ERREUR
            lockersContainer.innerHTML = `<p>Erreur: ${error.message}</p>`;
            return;
        }

        // ... reste de la fonction fetchAndDisplayLockers (utilise supabaseClient si besoin) ...
        if (lockers && lockers.length > 0) {
            lockersContainer.innerHTML = ''; // Vider le conteneur
            lockers.forEach(locker => {
                const lockerDiv = document.createElement('div');
                lockerDiv.classList.add('locker', locker.status); // 'available' ou 'reserved'
                lockerDiv.setAttribute('data-id', locker.id); // Stocker l'ID du casier

                lockerDiv.innerHTML = `
                    <h3>Casier ${locker.name}</h3>
                    <p>Statut: <span class="status-text">${locker.status === 'available' ? 'Disponible' : 'Réservé'}</span></p>
                    ${locker.size ? `<p>Taille: ${locker.size}</p>` : ''}
                    ${locker.location_description ? `<p>Lieu: ${locker.location_description}</p>` : ''}
                    <button class="action-button">
                        ${locker.status === 'available' ? 'Réserver' : 'Libérer'}
                    </button>
                `;
                lockersContainer.appendChild(lockerDiv);
            });
        } else {
            lockersContainer.innerHTML = '<p>Aucun casier trouvé.</p>';
        }

    } catch (err) {
        console.error('Erreur inattendue dans fetchAndDisplayLockers:', err);
        lockersContainer.innerHTML = '<p>Une erreur inattendue est survenue.</p>';
    }
}

// Fonction pour mettre à jour le statut d'un casier
async function updateLockerStatus(lockerId, newStatus) {
    if (!supabaseClient) return false; // Utilise supabaseClient ici

    try {
        const { data, error } = await supabaseClient // Utilise supabaseClient ici
            .from('lockers')
            .update({ status: newStatus })
            .eq('id', lockerId)
            .select();

        if (error) {
            console.error('Erreur lors de la mise à jour du casier:', error); // REGARDE CETTE ERREUR
            alert(`Erreur: ${error.message}`);
            return false;
        }
        console.log('Casier mis à jour:', data);
        return true;
    } catch (err) {
        console.error('Erreur inattendue lors de la mise à jour:', err);
        alert('Une erreur inattendue est survenue.');
        return false;
    }
}

// Fonction pour gérer le clic sur les boutons d'action (pas de changement direct ici, mais elle appelle updateLockerStatus)
async function handleActionButtonClick(event) {
    // ... (code inchangé) ...
    // elle appellera updateLockerStatus qui utilise maintenant supabaseClient
}

// Ajouter un écouteur d'événements global sur le conteneur des casiers
if (lockersContainer) {
    lockersContainer.addEventListener('click', handleActionButtonClick);
} else {
    console.error("Element 'lockers-container' non trouvé au moment d'ajouter l'écouteur.");
}

// ATTENTION: fetchAndDisplayLockers est maintenant appelé DANS le bloc try de l'initialisation
// Donc on n'a plus besoin de l'appeler ici s'il est déjà appelé après une initialisation réussie.
// Si tu veux le garder séparé, assure-toi qu'il est appelé APRÈS que supabaseClient soit défini.
// fetchAndDisplayLockers(); // Déplacé dans le bloc try après initialisation réussie.