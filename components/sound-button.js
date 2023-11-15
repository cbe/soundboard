import { LitElement, css, html } from "../dependencies/lit-core.min.js";

export class SoundButton extends LitElement {
  static properties = {
    audioFile: { type: String, attribute: "audio-file" },
    audioFileAvailable: { type: Boolean }
  }

  static styles = css`
    button {
      appearance: none;
      border: none;
      padding: calc(var(--spacing) / 2) calc(var(--spacing) / 2);
      border-radius: calc(var(--spacing) / 4);
      background-color: var(--c-surface0);
      color: var(--c-text);
      border: var(--border-width) solid var(--c-pink);
      width: 100%;
      height: 100%;
    }
    button:hover,
    button:focus {
      outline: none;
      cursor: pointer;
      border-color: var(--c-teal);
      box-shadow: 0 0 5px var(--c-teal);
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

  render() {
    return html`<button>
      <slot></slot>
    </button>`;
  }
}
customElements.define("sound-button", SoundButton);
