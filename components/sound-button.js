import { LitElement, css, html } from "../dependencies/lit-core.min.js";

export class SoundButton extends LitElement {
  static properties = {
    audioFile: { type: String, attribute: "audio-file" },
    audioFileAvailable: { type: Boolean }
  }

  static styles = css`
    * {
      box-sizing: border-box;
      margin: 0;
    }

    .button {
      appearance: none;
      outline: none;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: calc(var(--spacing) / 2) calc(var(--spacing) / 2);
      border-radius: var(--border-radius);
      background-color: var(--c-surface0);
      color: var(--c-text);
      border: var(--border-width) solid var(--c-pink);
      width: 100%;
      height: 100%;
    }
    .button:hover,
    .button:focus {
      cursor: pointer;
      border-color: var(--c-teal);
      box-shadow: 0 0 5px var(--c-teal);
    }

    .button-content {
      flex: 1;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .button-text {
      pointer-events: none;
    }
  `;

  constructor() {
    super();
    this.audioFile = "";
    this.audioFileAvailable = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.playAudioFile);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.playAudioFile);
  }

  async playAudioFile() {
    if (!this.audioFileAvailable) {
      this.audioElement = new Audio(this.audioFile);
      this.audioFileAvailable = true;
    }

    return this.audioElement.play();
  }

  handleDragStart(event) {
    event.dataTransfer.setData("text/plain", JSON.stringify({
      audioFile: this.audioFile,
      title: this.innerText,
    }));
    event.dataTransfer.effectAllowed = "copy";
  }

  render() {
    return html`<button
      class="button"
    >
      <span
        class="button-content"
        draggable="true"
        @dragstart="${this.handleDragStart}"
      >
        <span class="button-text">
          <slot></slot>
        </span>
      </span>
    </button>`;
  }
}
customElements.define("sound-button", SoundButton);
