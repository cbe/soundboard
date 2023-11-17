import { LitElement, css, html } from "../dependencies/lit-core.min.js";

export class SoundButton extends LitElement {
  static properties = {
    _favorites: { type: Array, state: true },
    _beingTargeted: { type: Boolean, state: true },
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
      margin-bottom: var(--spacing);
      padding-left: 0;
      display: grid;
      gap: calc(var(--spacing) / 2);
      grid-template-columns: repeat(2, 1fr);
    }
    @container (min-width: 30rem) {
      .favorites { grid-template-columns: repeat(3, 1fr); }
    }
    @container (min-width: 35rem) {
      .favorites { grid-template-columns: repeat(3, 1fr); }
    }
    @container (min-width: 40rem) {
      .favorites { grid-template-columns: repeat(6, 1fr); }
    }

    .dropzone {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: calc(var(--spacing) / 2);
      padding: calc(var(--spacing) / 2) calc(var(--spacing) / 2);
      border: var(--border-width) solid var(--c-lavender);
      border-radius: var(--border-radius);
      background-color: transparent;
      user-select: none;
    }
    .dropzone--active {
      background-color: var(--c-surface0);
      border-color: var(--c-green);
      animation: var(--animation-duration) ease-out 1 wiggle;
    }
  `;

  constructor() {
    super();
    this._beingTargeted = false;
    this._favorites = [];
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

  renderFavourite({ audioFile, title }) {
    if (!audioFile || !title) {
      return null;
    }

    return html`<li>
      <sound-button audio-file="${audioFile}">${title}</sound-button>
    </li>`;
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
      const { audioFile, title } = JSON
        .parse(event.dataTransfer.getData("text/plain") ?? "{}");

      const isValid = audioFile && audioFile !== "" && title;
      const alreadyFavorited = this._favorites
        .findIndex(({ audioFile: searchAudioFile }) =>
          searchAudioFile === audioFile) !== -1;

      if (!isValid || alreadyFavorited) {
        this._beingTargeted = false;
        return;
      }

      this._favorites = this._favorites.concat([{ audioFile, title }]);

      window.localStorage.setItem("favorites", JSON.stringify(this._favorites));
    }
    catch (_error) {
    }

    this._beingTargeted = false;
  }

  handleDragLeave(event) {
    event.preventDefault();
    this._beingTargeted = false;
  }

  render() {
    const dropzoneClass = [
      "dropzone",
      this._beingTargeted ? "dropzone--active" : "",
    ].join(" ").trim();

    return html`
      <ul class="favorites">
        ${this._favorites.map((favorite) => this.renderFavourite(favorite))}

        <li
          class="${dropzoneClass}"
          @dragenter="${this.handleDragEnter}"
          @dragover="${this.handleDragOver}"
          @drop="${this.handleDrop}"
          @dragleave="${this.handleDragLeave}"
        >
          <span>🫳</span>
          <span>Drop favorites here</span>
        </li>
      </ul>
    `;
  }
}
customElements.define("soundboard-favorites", SoundButton);
