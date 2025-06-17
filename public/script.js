const pokemonList = document.getElementById("pokemonListJs");
const searchInput = document.getElementById("search");
const searchButton = document.getElementById("searchButton");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const pageNumbers = document.getElementById("pageNumbers");

const limit = 18;
let offset = 0;
let currentPage = 1;
let totalPokemons = 0;
let maxPages = 1;

async function fetchTotalCount() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1");
  const data = await res.json();
  totalPokemons = data.count;
  maxPages = Math.ceil(totalPokemons / limit);
}

async function fetchPokemons() {
  pokemonList.innerHTML = "<p>Carregando...</p>";
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
    const data = await response.json();
    const pokemons = await Promise.all(
      data.results.map(async (pokemon) => {
        const res = await fetch(pokemon.url);
        return res.json();
      })
    );
    displayPokemons(pokemons);
    updatePagination();
  } catch (err) {
    pokemonList.innerHTML = "<p>Erro ao carregar Pokémon.</p>";
  }
}

function displayPokemons(pokemons) {
  pokemonList.innerHTML = pokemons.map(p => `
    <div class="pokemonList__card fade-in" data-id="${p.id}">
      <div class="cardInfos">
        <div class="type">${p.types.map(t => t.type.name).join(', ')}</div>
        <p class="number">#${p.id}</p>
      </div>
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png" alt="${p.name}">
      <h3>${p.name}</h3>
    </div>
  `).join("");

  document.querySelectorAll(".pokemonList__card").forEach(card => {
    card.addEventListener("click", async () => {
      const id = card.getAttribute("data-id");
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const p = await res.json();

      document.getElementById("modalDetails").innerHTML = `
        <h2>${p.name} #${p.id}</h2>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png" alt="${p.name}">
        <p><strong>Tipo:</strong> ${p.types.map(t => t.type.name).join(', ')}</p>
        <p><strong>Altura:</strong> ${p.height / 10} m</p>
        <p><strong>Peso:</strong> ${p.weight / 10} kg</p>
        <p class="powers"><strong>Habilidades:</strong> <span>${p.abilities.map(a => a.ability.name).join(', ')}</span></p>
      `;

      document.getElementById("pokemonModal").classList.remove("hidden");
    });
  });
}

document.getElementById("modalClose").addEventListener("click", () => {
  document.getElementById("pokemonModal").classList.add("hidden");
});



function updatePagination() {
  pageNumbers.innerHTML = "";

  const visiblePages = 3;
  let startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  let endPage = startPage + visiblePages - 1;

  if (endPage > maxPages) {
    endPage = maxPages;
    startPage = Math.max(1, endPage - visiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.classList.add("page-btn");
    if (i === currentPage) btn.classList.add("active");
    btn.textContent = i;
    btn.addEventListener("click", () => {
      currentPage = i;
      offset = (i - 1) * limit;
      fetchPokemons();
    });
    pageNumbers.appendChild(btn);
  }

  prevButton.disabled = currentPage === 1;
  nextButton.disabled = currentPage === maxPages;
}

function searchPokemon() {
  const query = searchInput.value.toLowerCase().trim();
  if (!query) {
    currentPage = 1;
    offset = 0;
    fetchPokemons();
    return;
  }

  pokemonList.innerHTML = "<p>Buscando...</p>";
  fetch(`https://pokeapi.co/api/v2/pokemon/${query}`)
    .then(res => {
      if (!res.ok) throw new Error("Não encontrado");
      return res.json();
    })
    .then(data => {
      displayPokemons([data]);
      pageNumbers.innerHTML = "";
      prevButton.disabled = true;
      nextButton.disabled = true;
    })
    .catch(() => {
      pokemonList.innerHTML = "<p>Pokémon não encontrado.</p>";
    });
}

searchButton.addEventListener("click", searchPokemon);

searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchPokemon();
  }
});

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  if (query === "") {
    currentPage = 1;
    offset = 0;
    fetchPokemons();
  }
});


prevButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    offset -= limit;
    fetchPokemons();
  }
});

nextButton.addEventListener("click", () => {
  if (currentPage < maxPages) {
    currentPage++;
    offset += limit;
    fetchPokemons();
  }
});

(async () => {
  await fetchTotalCount();
  fetchPokemons();
})();
