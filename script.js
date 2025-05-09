// Remplace par tes propres URL et clé anon de Supabase !
const SUPABASE_URL = 'https://oqzodloceehlylgisewb.supabase.co'; // Trouvé dans Project Settings > API > Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xem9kbG9jZWVobHlsZ2lzZXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDE0NzMsImV4cCI6MjA2MjM3NzQ3M30.pN9V-cpQXlRKUAq7Khmn__ePJBKeR3x5o35MGvqIqvE'; // Trouvé dans Project Settings > API > anon public

// Initialiser le client Supabase
let supabase;
try {
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialisé.');
} catch (error) {
    console.error('Erreur initialisation Supabase:', error);
    document.getElementById('lockers-container').innerHTML = '<p>Erreur de connexion à la base de données.</p>';
}


const lockersContainer = document.getElementById('lockers-container');

// Fonction pour récupérer et afficher les casiers
async function fetchAndDisplayLockers() {
    if (!supabase) return;

    lockersContainer.innerHTML = '<p>Chargement des casiers...</p>'; // Message de chargement

    try {
        // 'lockers' est le nom de ta table
        let { data: lockers, error } = await supabase
            .from('lockers')
            .select('*') // Récupère toutes les colonnes
            .order('name', { ascending: true }); // Optionnel: trier par nom

        if (error) {
            console.error('Erreur lors de la récupération des casiers:', error);
            lockersContainer.innerHTML = `<p>Erreur: ${error.message}</p>`;
            return;
        }

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
        console.error('Erreur inattendue:', err);
        lockersContainer.innerHTML = '<p>Une erreur inattendue est survenue.</p>';
    }
}

// Appeler la fonction au chargement de la page
fetchAndDisplayLockers();