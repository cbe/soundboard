import {
  LitElement,
  css,
  html,
  nothing,
} from "../dependencies/lit-core.min.js";
import { get, set } from "../dependencies/idb-keyval.min.js";

const moveElementInArray = (list, oldIndex, newIndex) => {
  const listWithoutOldItem = list.toSpliced(oldIndex, 1);

  return listWithoutOldItem.toSpliced(newIndex, 0, list[oldIndex]);
};

export class SoundboardFavorites extends LitElement {
  static properties = {
    minimal: { type: Boolean, attribute: "minimal" },
    removed: { type: Array, attribute: "removed" },
    _favorites: { type: Array, state: true },
    _beingTargeted: { type: Boolean, state: true },
    _isRemoving: { type: Boolean, state: true },
  };

  static styles = css`
    @keyframes wiggle {
      10% {
        rotate: -3deg;
      }
      20% {
        rotate: -1deg;
      }
      30% {
        rotate: -5deg;
      }
      50% {
        rotate: 2deg;
      }
      60% {
        rotate: -1deg;
      }
      70% {
        rotate: 0deg;
      }
      80% {
        rotate: -3deg;
      }
      100% {
        rotate: 0deg;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
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
    this.removed = [];
    this._beingTargeted = false;
    this._favorites = [];
    this._isRemoving = false;
  }

  connectedCallback() {
    super.connectedCallback();

    this.queryFavorites();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  get hasFavorites() {
    return this._favorites.length > 0;
  }

  async queryFavorites() {
    const restoredFavorites = (await get("soundboard-favorites")) ?? [];

    this.updateFavorites(
      restoredFavorites.filter(
        (favorite) => !this.removed.includes(favorite.audioFile)
      )
    );
  }

  findIndexOfAudioFile(searchAudioFile) {
    return this._favorites.findIndex(
      ({ audioFile }) => audioFile === searchAudioFile
    );
  }

  async updateFavorites(favorites) {
    this._favorites = favorites;
    await set("soundboard-favorites", favorites);
  }

  resetOptics() {
    this._beingTargeted = false;
    this._isRemoving = false;
  }

  renderFavourite({ audioFile, title, emoji, repeatable }) {
    if (!audioFile || !title) {
      return null;
    }

    const dragStartFavorite = (event) => {
      this._isRemoving = true;
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          audioFile,
          title,
          emoji,
          repeatable,
          removeFromFavorites: true,
        })
      );
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
          title: draggedTitle,
          emoji: draggedEmoji,
          repeatable: draggedRepeatable,
        } = JSON.parse(event.dataTransfer.getData("text/plain") ?? "{}");

        const indexOfTargetedFavorite = this.findIndexOfAudioFile(audioFile);
        const indexOfDraggedFavorite =
          this.findIndexOfAudioFile(draggedAudioFile);
        const shouldReplace = indexOfDraggedFavorite === -1;

        const newFavorites = shouldReplace
          ? this._favorites.map((favorite, index) =>
              index === indexOfTargetedFavorite
                ? {
                    audioFile: draggedAudioFile,
                    title: draggedTitle,
                    emoji: draggedEmoji,
                    repeatable: draggedRepeatable,
                  }
                : favorite
            )
          : moveElementInArray(
              this._favorites,
              indexOfDraggedFavorite,
              indexOfTargetedFavorite
            );

        this.updateFavorites(newFavorites);
        event.target.classList.remove("targeted");
      } catch (_error) {}
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
          emoji="${emoji}"
          exportparts="
            button: sound-button,
            content: sound-button-content,
            progress: sound-button-progress
          "
          repeatable="${repeatable || nothing}"
        >
          ${title}
        </sound-button>
      </li>
    `;
  }

  selectFiles(event) {
    const uploadInput = document.createElement("input");
    uploadInput.type = "file";
    uploadInput.accept = "audio/*";
    uploadInput.multiple = true;
    uploadInput.addEventListener("change", () => {
      this.handleDrop({
        preventDefault: () => {}, // Required by `handleDrop`
        dataTransfer: {
          files: uploadInput.files,
          getData: () => {}, // Required by `handleDrop`
        },
      });
    });

    uploadInput.click();
  }

  handleDragEnter(event) {
    event.preventDefault();
  }

  handleDragOver(event) {
    event.preventDefault();
    this._beingTargeted = true;
    event.dataTransfer.dropEffect = "copy";
  }

  async blobToDataUrl(blob) {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(blob);

    return new Promise((resolve, reject) => {
      fileReader.addEventListener("loadend", () => {
        resolve(fileReader.result);
      });
    });
  }

  async handleDrop(event) {
    event.preventDefault();

    try {
      const transferredFiles =
        event.dataTransfer.files.length > 0
          ? Array.from(
              { length: event.dataTransfer.files.length },
              (_, index) => event.dataTransfer.files.item(index)
            ).filter((file) => file.type.startsWith("audio/"))
          : [];

      const droppedButton = (() => {
        try {
          const { audioFile, emoji, title, repeatable, removeFromFavorites } =
            JSON.parse(event.dataTransfer.getData("text/plain") ?? "{}");

          return { audioFile, emoji, title, repeatable, removeFromFavorites };
        } catch (error) {
          return undefined;
        }
      })();
      const droppedFiles = await Promise.all(
        transferredFiles.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const blob = new Blob([buffer], { type: file.type });
          const url = await this.blobToDataUrl(blob);

          return {
            audioFile: url,
            emoji: "🆕",
            title: file.name,
            repeatable: false,
            removeFromFavorites: false,
          };
        })
      );
      const soundsToProcess = (droppedButton ? [droppedButton] : []).concat(
        droppedFiles
      );

      await Promise.all(
        soundsToProcess.map(async (sound) => {
          const { audioFile, emoji, title, repeatable, removeFromFavorites } =
            sound;

          if (removeFromFavorites) {
            const newFavorites = this._favorites.filter(
              (favorite) => favorite.audioFile !== audioFile
            );

            await this.updateFavorites(newFavorites);

            return;
          }

          const isValid =
            audioFile !== undefined && audioFile !== "" && title !== undefined;
          const existingFavoriteIndex = this._favorites.findIndex(
            ({ audioFile: searchAudioFile }) => searchAudioFile === audioFile
          );
          const alreadyFavorited = existingFavoriteIndex !== -1;

          if (!isValid) {
            return;
          }

          const newFavorite = { audioFile, title, emoji, repeatable };
          const newFavorites = alreadyFavorited
            ? this._favorites.toSpliced(existingFavoriteIndex, 1, newFavorite)
            : this._favorites.concat([newFavorite]);

          await this.updateFavorites(newFavorites);
        })
      );
    } catch (error) {
      console.warn(
        "Error while trying to add or remove a sound button. Full error",
        error
      );
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
    ]
      .join(" ")
      .trim();
    const dropzoneIcon = this._isRemoving ? "🗑️" : "🫳";
    const dropzoneText = this._isRemoving
      ? "Remove"
      : this.hasFavorites
      ? "Add"
      : "Drop favorites here";

    return html`
      <ul part="list">
        ${this.minimal
          ? null
          : this._favorites.map((favorite) => this.renderFavourite(favorite))}

        <li
          class="${dropzoneClass}"
          part="dropzone"
          @click="${this.selectFiles}"
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
