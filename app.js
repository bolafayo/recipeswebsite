 const recipeList = document.getElementById('recipeList');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    let currentPage = 1;
    const limit = 15;

    async function fetchRecipes(page = 1) {
      const skip = (page - 1) * limit;
      const url = `https://dummyjson.com/recipes?limit=${limit}&skip=${skip}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        renderRecipes(data.recipes);
        updatePageInfo(page, data.total);
      } catch (err) {
        VanillaToasts.create({
          title: 'Error', text: 'Failed to load recipes.', type: 'error', timeout: 4000,
        });
      }
    }

    function renderRecipes(recipes) {
      recipeList.innerHTML = '';
      const favorites = getFavorites();

      recipes.forEach(recipe => {
        const isFav = favorites.includes(recipe.id.toString());
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
          <img src="${recipe.image}" alt="${recipe.name}" />
          <div class="card-content">
            <h3>${recipe.name}</h3>
            <p>${recipe.cuisine}</p>
            <p>⏱️ ${recipe.cookTimeMinutes} mins</p>
            <p>⭐ ${recipe.rating}</p>
            <button class="fav-btn" data-id="${recipe.id}">${isFav ? '❤️' : '🤍'}</button>
            <button class="view-btn" data-id="${recipe.id}">View</button>
          </div>`;
        recipeList.appendChild(card);
      });

      document.querySelectorAll('.fav-btn').forEach(btn => btn.addEventListener('click', handleFavoriteToggle));
      document.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', () => showSingleRecipe(btn.getAttribute('data-id'))));
    }

    function updatePageInfo(page, totalItems) {
      currentPage = page;
      const totalPages = Math.ceil(totalItems / limit);
      pageInfo.textContent =  
      prevBtn.disabled = page === 1;
      nextBtn.disabled = page === totalPages;
    }

    prevBtn.addEventListener('click', () => currentPage > 1 && fetchRecipes(currentPage - 1));
    nextBtn.addEventListener('click', () => fetchRecipes(currentPage + 1));

    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (!query) {
        VanillaToasts.create({ title: 'Empty Search', text: 'Please type something.', type: 'warning', timeout: 3000 });
        return;
      }
      searchRecipes(query);
    });

    searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchBtn.click();
    });

    async function searchRecipes(query) {
      try {
        const res = await fetch(`https://dummyjson.com/recipes/search?q=${query}`);
        const data = await res.json();
        if (data.recipes.length === 0) {
          VanillaToasts.create({ title: 'No Results', text: 'No recipes matched your search.', type: 'info', timeout: 3000 });
        }
        renderRecipes(data.recipes);
        pageInfo.textContent = `Search: ${query}`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
      } catch (err) {
        VanillaToasts.create({ title: 'Error', text: 'Search failed.', type: 'error', timeout: 4000 });
      }
    }

    function getFavorites() {
      return JSON.parse(localStorage.getItem('favorites')) || [];
    }

    function saveFavorites(favs) {
      localStorage.setItem('favorites', JSON.stringify(favs));
    }

    function handleFavoriteToggle(e) {
      const recipeId = e.target.getAttribute('data-id');
      let favorites = getFavorites();
      if (favorites.includes(recipeId)) {
        favorites = favorites.filter(id => id !== recipeId);
        VanillaToasts.create({ title: 'Removed', text: `Recipe #${recipeId} removed.`, type: 'warning', timeout: 3000 });
      } else {
        favorites.push(recipeId);
        VanillaToasts.create({ title: 'Added', text: `Recipe #${recipeId} added to favorites.`, type: 'success', timeout: 3000 });
      }
      saveFavorites(favorites);
      fetchRecipes(currentPage);
    }

    async function showSingleRecipe(id) {
      try {
        const res = await fetch(`https://dummyjson.com/recipes/${id}`);
        const recipe = await res.json();
        recipeList.innerHTML = `
          <div class="single-recipe">
            <h2>${recipe.name}</h2>
            <img src="${recipe.image}" alt="${recipe.name}" />
            <p><strong>Cuisine:</strong> ${recipe.cuisine}</p>
            <p><strong>Meal Type:</strong> ${recipe.mealType.join(', ')}</p>
            <p><strong>Tags:</strong> ${recipe.tags.join(', ')}</p>
            <p><strong>Prep Time:</strong> ${recipe.prepTimeMinutes} min</p>
            <p><strong>Cook Time:</strong> ${recipe.cookTimeMinutes} min</p>
            <p><strong>Rating:</strong> ⭐ ${recipe.rating}</p>
            <h3>Ingredients</h3>
            <ul>${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
            <h3>Instructions</h3>
            <ol>${recipe.instructions.map(step => `<li>${step}</li>`).join('')}</ol>
            <button id="backBtn">← Back to list</button>
          </div>`;
        pageInfo.textContent = `Viewing: ${recipe.name}`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        document.getElementById('backBtn').addEventListener('click', () => fetchRecipes(currentPage));
      } catch (err) {
        VanillaToasts.create({ title: 'Error', text: 'Failed to load recipe.', type: 'error', timeout: 3000 });
      }
    }

    document.querySelectorAll('.filter-btn').forEach(button => {
      button.addEventListener('click', () => {
        const filterValue = button.getAttribute('data-filter').toLowerCase();
        filterRecipes(filterValue);
      });
    });

    async function filterRecipes(filterValue) {
      try {
        const res = await fetch('https://dummyjson.com/recipes?limit=100');
        const data = await res.json();
        const filtered = data.recipes.filter(recipe => {
          const tags = recipe.tags.map(t => t.toLowerCase());
          const cuisine = recipe.cuisine.toLowerCase();
          const mealType = recipe.mealType.join(' ').toLowerCase();
          return tags.includes(filterValue) || cuisine.includes(filterValue) || mealType.includes(filterValue);
        });
        if (filtered.length === 0) {
          VanillaToasts.create({ title: 'No Match', text: `No recipes found for "${filterValue}"`, type: 'info', timeout: 3000 });
        }
        renderRecipes(filtered);
        pageInfo.textContent = `Filtered: ${filterValue}`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
      } catch (err) {
        VanillaToasts.create({ title: 'Error', text: 'Could not filter recipes.', type: 'error', timeout: 3000 });
      }
    }

      fetchRecipes();
    function saveCustomFilter(groupId ,  filters) {
      const saved = JSON.parse(localStorage.getItem('custom-filters')) || {}
      saved[groupId] = filters
      localStorage.getItem('custom-filters', JSON.stringify(saved))

    }
    function loadCustomFilters() {
      const saved = JSON.parse(localStorage.getItem('custom-filters')) || {}
      Object.entries(saved).forEach(([groupId, filters]) =>{
        const group = document.getElementById(groupId)
        filters.forEach(filterValue =>{
          const nextBtn = document.createElement('button')
          newBtn.className = 'filter-btn'
          newBtn.setAttribute('data-filter', filterValue)
          newBtn.textContent = filterValue
          newBtn.addEventListener('click',()=> filterRecipes(filterValue.toLowerCase()))
          group.appendChild(newBtn)
        })
      }

      )
      
    }
    document.querySelectorAll('.add-btn').forEach(btn =>{
      btn.addEventListener('click',() =>{
        const groupId = btn.getAttribute('data-group')
        const group = document.getElementById(groupId)
        const filterValue = prompt('Enter new filter option:')
        if(filterValue){
          nextBtn.className = 'filter-btn'
          newBtn.setAttribute('data-filter', filterValue)
          newBtn.textContent = filterValue
          newBtn.addEventListener('click',() => filterRecipes(filterValue.toLowerCase()))
          group.appendChild(newBtn)

          const current = Array.from(group.querySelectorAll('.filter-btn')).map(btn => btn.getAttribute('data-filter'))
        }
      })
    })
loadCustomFilters()
  