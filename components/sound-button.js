import { LitElement, css, html } from "../dependencies/lit-core.min.js";

export class SoundButton extends LitElement {
  static properties = {
    audioFile: { type: String, attribute: "audio-file" },
    _audioFileAvailable: { type: Boolean, state: true },
  }

  static styles = css`
    button {
      display: flex;
      align-items: center;
      justify-content: center;
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
    this._audioFileAvailable = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.playAudioFile);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.playAudioFile);
  }

  attributeChangedCallback(...args) {
    super.attributeChangedCallback(...args);

    if (this._audioFileAvailable) {
      this.audioElement = new Audio(this.audioFile);
    }
  }

  async playAudioFile(event) {
    if (!this._audioFileAvailable) {
      this.audioElement = new Audio(this.audioFile);
      this._audioFileAvailable = true;
    }

    return this.audioElement.play();
  }

  render() {
    return html`
      <button part="button">
        <span
          class="button-content"
          draggable="true"
        >
          <span class="button-text">
            <slot></slot>
          </span>
        </span>
      </button>
    `;
  }
}
customElements.define("sound-button", SoundButton);
