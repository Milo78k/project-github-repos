class View {
  constructor() {
    this.app = document.getElementById("app");

    this.searchLine = this.createElement("div", "search-line");
    this.searchInput = this.createElement("input", "search-input");
    this.searchInput.placeholder = "Find repositories";
    this.searchLine.append(this.searchInput);

    this.autoCompleteList = this.createElement("ul", "autocomplete-list");
    this.searchLine.append(this.autoCompleteList);

    this.repoWrapper = this.createElement("div", "repo-wrapper");
    this.repoList = this.createElement("ul", "repo-list");
    this.repoWrapper.append(this.repoList);

    this.searchLine.append(this.repoWrapper);
    this.app.append(this.searchLine);
  }

  createElement(tag, className) {
    const element = document.createElement(tag);
    if (className) element.classList.add(className);
    return element;
  }

  showAutoComplete(repos) {
    this.autoCompleteList.innerHTML = "";
    repos.forEach((repo) => {
      const item = this.createElement("li", "autocomplete-item");
      item.textContent = repo.name;
      item.addEventListener("click", () => {
        this.addRepoToList(repo);
        this.searchInput.value = "";
        this.autoCompleteList.innerHTML = "";
      });
      this.autoCompleteList.append(item);
    });
  }

  addRepoToList(repo) {
    const listItem = this.createElement("li", "repo-item");
    listItem.insertAdjacentHTML(
      "beforeend",
      `
        <div class="repo-content">
          <p>Name: ${repo.name}</p>
          <p>Owner: ${repo.owner.login}</p>
          <p>Stars: ${repo.stargazers_count}</p>
        </div>
      `
    );

    const btnWrapper = this.createElement("div", "btn-wrapper");
    const removeBtn = this.createElement("button", "remove-btn");

    const removeHandler = () => {
      listItem.remove();
      removeBtn.removeEventListener("click", removeHandler);
    };

    removeBtn.addEventListener("click", removeHandler);

    btnWrapper.append(removeBtn);
    listItem.append(btnWrapper);
    this.repoList.append(listItem);
  }
}

const debounce = (fn, debounceTime) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, debounceTime);
  };
};
class Search {
  constructor(view) {
    this.view = view;
    this.searchRepos = this.searchRepos.bind(this);
    this.debouncedSearch = debounce(this.searchRepos, 500);

    this.view.searchInput.addEventListener("input", this.debouncedSearch);
  }

  async searchRepos() {
    const inputValue = this.view.searchInput.value.trim();
    if (inputValue.length === 0) {
      this.view.autoCompleteList.innerHTML = "";
      return;
    }

    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${inputValue}&per_page=5`
      );
      if (!response.ok) throw new Error("Ошибка загрузки данных");

      const data = await response.json();
      this.view.showAutoComplete(data.items);
    } catch (error) {
      console.error(error);
    }
  }
}

new Search(new View());
