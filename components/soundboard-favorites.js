import { LitElement, css, html } from "../dependencies/lit-core.min.js";

export class SoundboardFavorites extends LitElement {
  static properties = {
    minimal: { type: Boolean, attribute: "minimal" },
    _favorites: { type: Array, state: true },
    _beingTargeted: { type: Boolean, state: true },
    _isRemoving: { type: Boolean, state: true },
  }

  static styles = css`
    @keyframes wiggle {
      10% { rotate: -3deg; }
      20% { rotate: -1deg; }
      30% { rotate: -5deg; }
      50% { rotate: 2deg; }
      60% { rotate: -1deg; }
      70% { rotate: 0deg; }
      80% { rotate: -3deg; }
      100% { rotate: 0deg; }
    }

    * {
      box-sizing: border-box;
      margin: 0;
    }

    .favorites {
      list-style-type: none;
      padding-left: 0;
      display: grid;
      gap: calc(var(--spacing) / 2);
      grid-template-columns: repeat(2, 1fr);
    }
    @container (min-width: 30rem) {
      .favorites { grid-template-columns: repeat(3, 1fr); }
    }
    @container (min-width: 40rem) {
      .favorites { grid-template-columns: repeat(6, 1fr); }
    }

    li:is(.dropzone--active),
    li:has(sound-button.targeted) {
      animation: var(--animation-duration) ease-out 1 wiggle;
    }

    .dropzone {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: calc(var(--spacing) / 2);
      padding: calc(var(--spacing) / 2) calc(var(--spacing) / 2);
      border: var(--border-width) solid var(--c-lavender);
      border-radius: var(--border-radius);
      background-color: var(--c-base);
      user-select: none;
      font-size: var(--button-font-size);

      border-color: var(--c-overlay2);
      border-style: dashed;
      box-shadow: unset;
    }
    .dropzone:is(:first-child) {
      grid-column: 1 / -1;
      min-height: clamp(3rem, 10vw, 5rem);
    }
    .dropzone--active {
      background-color: var(--c-mantle);
      border-color: var(--c-green);
    }
    .dropzone--removing.dropzone--active {
      border-color: var(--c-red);
    }

    sound-button::part(button) {
      position: relative;
    }
    sound-button.targeted::part(button) {
      border-color: var(--c-overlay2) !important;
      border-style: dashed !important;
      box-shadow: unset !important;
    }
    sound-button.targeted::part(button)::before {
      pointer-events: none;
      position: absolute;
      content: "📥";
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--c-mantle);
      border-radius: var(--border-radius);
    }
  `;

  constructor() {
    super();
    this.minimal = false;
    this._beingTargeted = false;
    this._favorites = [];
    this._isRemoving = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this._favorites = JSON.parse(window.localStorage.getItem("favorites")) ?? [];
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  get hasFavorites() {
    return this._favorites.length > 0;
  }

  findIndexOfAudioFile(searchAudioFile) {
    return this._favorites
      .findIndex(({ audioFile }) =>
        audioFile === searchAudioFile);
  }

  updateFavorites(favorites) {
    this._favorites = favorites;
    window.localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  resetOptics() {
    this._beingTargeted = false;
    this._isRemoving = false;
  }

  renderFavourite({ audioFile, title }) {
    if (!audioFile || !title) {
      return null;
    }

    const dragStartFavorite = (event) => {
      this._isRemoving = true;
      event.dataTransfer.setData("text/plain", JSON.stringify({
        audioFile,
        title,
        removeFromFavorites: true,
      }));
    };

    const dragEndFavorite = (event) => {
      this.resetOptics();
    };

    const dragOverFavorite = (event) => {
      event.preventDefault();

      event.dataTransfer.dropEffect = "copy";
      event.target.classList.add("targeted");
    };

    const dragLeaveFavorite = (event) => {
      event.preventDefault();

      event.target.classList.remove("targeted");
    };

    const dropOnFavorite = (event) => {
      event.preventDefault();

      try {
        const {
          audioFile: draggedAudioFile,
          title: draggedTitle
        } = JSON.parse(event.dataTransfer.getData("text/plain") ?? "{}");

        const indexOfTargetedFavorite = this.findIndexOfAudioFile(audioFile);
        const indexOfDraggedFavorite = this.findIndexOfAudioFile(draggedAudioFile);
        const shouldReplace = indexOfDraggedFavorite === -1;

        const newFavorites = shouldReplace
          ? this._favorites.map((favorite, index) => index === indexOfTargetedFavorite
            ? ({
              audioFile: draggedAudioFile,
              title: draggedTitle,
            })
            : favorite)
          : this._favorites
            .toSpliced(indexOfDraggedFavorite, 1)
            .toSpliced(indexOfTargetedFavorite, 0, {
              audioFile: draggedAudioFile,
              title: draggedTitle,
            });

        this.updateFavorites(newFavorites);
        event.target.classList.remove("targeted");
      }
      catch (_error) {
      }
    };

    return html`
      <li>
        <sound-button
          @dragstart="${dragStartFavorite}"
          @dragend="${dragEndFavorite}"
          @dragover="${dragOverFavorite}"
          @dragleave="${dragLeaveFavorite}"
          @drop="${dropOnFavorite}"
          audio-file="${audioFile}"
          exportparts="button: sound-button"
        >
          ${title}
        </sound-button>
      </li>
    `;
  }

  handleDragEnter(event) {
    event.preventDefault();
  }

  handleDragOver(event) {
    event.preventDefault();
    this._beingTargeted = true;
    event.dataTransfer.dropEffect = "copy";
  }

  handleDrop(event) {
    event.preventDefault();

    try {
      const { audioFile, title, removeFromFavorites = false } = JSON
        .parse(event.dataTransfer.getData("text/plain") ?? "{}");

      if (removeFromFavorites) {
        const newFavorites = this._favorites
          .filter((favorite) => favorite.audioFile !== audioFile);

        this.updateFavorites(newFavorites);
        this.resetOptics();

        return;
      }

      const isValid = audioFile && audioFile !== "" && title;
      const alreadyFavorited = this._favorites
        .findIndex(({ audioFile: searchAudioFile }) =>
          searchAudioFile === audioFile) !== -1;

      if (!isValid || alreadyFavorited) {
        this.resetOptics();

        return;
      }

      const newFavorites = this._favorites.concat([{ audioFile, title }]);
      this.updateFavorites(newFavorites);
    }
    catch (_error) {
    }

    this.resetOptics();
  }

  handleDragLeave(event) {
    event.preventDefault();
    this._beingTargeted = false;
  }

  render() {
    const dropzoneClass = [
      "dropzone",
      this._beingTargeted ? "dropzone--active" : "",
      this._isRemoving ? "dropzone--removing" : "",
    ].join(" ").trim();
    const dropzoneIcon = this._isRemoving ? "🗑️" : "🫳";
    const dropzoneText = this._isRemoving
      ? "Remove"
      : this.hasFavorites
        ? "Add"
        : "Drop favorites here";

    return html`
      <ul class="favorites">
        ${this.minimal
          ? null
          : this._favorites.map((favorite) => this.renderFavourite(favorite))
        }

        <li
          class="${dropzoneClass}"
          part="dropzone"
          @dragenter="${this.handleDragEnter}"
          @dragover="${this.handleDragOver}"
          @drop="${this.handleDrop}"
          @dragleave="${this.handleDragLeave}"
        >
          <span>${dropzoneIcon}</span>
          <span>${dropzoneText}</span>
        </li>
      </ul>
    `;
  }
}
customElements.define("soundboard-favorites", SoundboardFavorites);
