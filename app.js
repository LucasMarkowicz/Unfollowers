document.getElementById('followersFile').addEventListener('change', handleFileSelect);
document.getElementById('followingFile').addEventListener('change', handleFileSelect);

const MAX_FILE_SIZE = 500 * 1024; // 500 KB máximo

let followersData = null;
let followingData = null;

function handleFileSelect(event) {
    const file = event.target.files[0];
    const fileType = file.type;
    const fileSize = file.size;

    // Verificar si el archivo es un JSON
    if (fileType !== "application/json") {
        alert("Solo se permiten archivos JSON.");
        event.target.value = ""; // Limpiar la selección del archivo
        return;
    }

    // Verificar si el archivo excede el tamaño máximo
    if (fileSize > MAX_FILE_SIZE) {
        alert("El archivo es demasiado grande. El tamaño máximo permitido es 500 KB.");
        event.target.value = ""; // Limpiar la selección del archivo
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const jsonData = JSON.parse(content);

            // Validar estructura básica del JSON
            if (event.target.id === 'followersFile') {
                if (!validateFollowersJSON(jsonData)) {
                    alert("El archivo de seguidores no tiene la estructura correcta.");
                    event.target.value = ""; // Limpiar la selección del archivo
                    return;
                }
                followersData = jsonData;
            } else if (event.target.id === 'followingFile') {
                if (!validateFollowingJSON(jsonData)) {
                    alert("El archivo de seguidos no tiene la estructura correcta.");
                    event.target.value = ""; // Limpiar la selección del archivo
                    return;
                }
                followingData = jsonData;
            }

            // Habilitar el botón solo cuando ambos archivos han sido cargados
            if (followersData && followingData) {
                document.getElementById('compareButton').disabled = false;
            }
        } catch (error) {
            alert("Hubo un error al leer el archivo JSON.");
            event.target.value = ""; // Limpiar la selección del archivo
        }
    };

    reader.readAsText(file);
}

// Función para validar la estructura del archivo de seguidores
function validateFollowersJSON(jsonData) {
    return Array.isArray(jsonData) && jsonData.every(item => 
        item.string_list_data && 
        Array.isArray(item.string_list_data) && 
        item.string_list_data[0] && 
        item.string_list_data[0].value
    );
}

// Función para validar la estructura del archivo de seguidos
function validateFollowingJSON(jsonData) {
    return jsonData.relationships_following && Array.isArray(jsonData.relationships_following) && jsonData.relationships_following.every(item => 
        item.string_list_data && 
        Array.isArray(item.string_list_data) && 
        item.string_list_data[0] && 
        item.string_list_data[0].value
    );
}

document.getElementById('compareButton').addEventListener('click', function() {
    const result = compareFollowers(followersData, followingData);
    displayResult(result);
});

function compareFollowers(followers, following) {
    // Obtener los valores de "value" y "href" de los seguidores
    const followersSet = new Set(
        followers.map(follower => follower.string_list_data[0].value)
    );

    // Encontrar usuarios a los que sigues pero no te siguen
    const notFollowingBack = following.relationships_following.filter(person => {
        const username = person.string_list_data[0].value;
        return !followersSet.has(username);
    }).map(person => {
        return {
            username: person.string_list_data[0].value,
            href: person.string_list_data[0].href
        };
    });

    return notFollowingBack;
}

function displayResult(result) {
    const resultContainer = document.getElementById('result');

    if (result.length === 0) {
        resultContainer.innerText = "Todos los usuarios que sigues también te siguen.";
    } else {
        resultContainer.innerHTML = `<p>Los siguientes usuarios no te siguen de vuelta:</p><ul>${result.map(user => `<li><a href="${user.href}" target="_blank">${user.username}</a></li>`).join('')}</ul>`;
    }
}
