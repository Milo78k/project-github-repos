class View {
  constructor() {
    this.app = document.getElementById("app");

    this.searchLine = this.createElement("div", "search-line");
    this.searchInput = this.createElement("input", "search-input");
    this.searchInput.placeholder = "Find repositories";
    this.searchInput.setAttribute("aria-label", "Find repositories");
    this.status = this.createElement("p", "search-status");
    this.status.setAttribute("role", "status");
    this.searchLine.append(this.status);
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
      const button = this.createElement("button", "autocomplete-button");
      button.textContent = repo.full_name || repo.name;
      item.append(button);
      button.addEventListener("click", () => {
        this.addRepoToList(repo);
        this.status.textContent = "";
        this.searchInput.value = "";
        this.autoCompleteList.innerHTML = "";
      });
      this.autoCompleteList.append(item);
    });
  }

  addRepoToList(repo) {
    const listItem = this.createElement("li", "repo-item");
    const content = this.createElement("div", "repo-content");
    for (const [label, value] of [["Name", repo.name], ["Owner", repo.owner.login], ["Stars", repo.stargazers_count]]) {
      const line = this.createElement("p");
      line.textContent = `${label}: ${value}`;
      content.append(line);
    }
    listItem.append(content);

    const btnWrapper = this.createElement("div", "btn-wrapper");
    const removeBtn = this.createElement("button", "remove-btn");

    removeBtn.setAttribute("aria-label", `Remove ${repo.name}`);

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

    this.controller = null;
    this.version = 0;
    this.view.searchInput.addEventListener("input", () => {
      this.version += 1;
      this.controller?.abort();
      this.view.autoCompleteList.replaceChildren();
      this.view.status.textContent = "";
      this.debouncedSearch();
    });
  }

  async searchRepos() {
    const inputValue = this.view.searchInput.value.trim();
    if (inputValue.length === 0) {
      this.view.autoCompleteList.innerHTML = "";
      return;
    }

    const version = this.version;
    this.controller = new AbortController();
    const { signal } = this.controller;
    this.view.status.textContent = "Loading…";
    try {
      const response = await fetch(
        `https://api.github.com/search/repositories?${new URLSearchParams({ q: inputValue, per_page: "5" })}`,
        { signal }
      );
      if (!response.ok) throw new Error("Ошибка загрузки данных");

      const data = await response.json();
      if (signal.aborted || version !== this.version) return;
      this.view.showAutoComplete(data.items);
      this.view.status.textContent = data.items.length ? "" : "No repositories found.";
    } catch (error) {
      if (signal.aborted || version !== this.version) return;
      this.view.status.textContent = "Could not load repositories. Try again later (GitHub may limit requests).";
    }
  }
}

new Search(new View());
