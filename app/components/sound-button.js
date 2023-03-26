import { LitElement, html } from "../dependencies/lit-core.min.js";

export class SoundButton extends LitElement {
  static properties = {
    audioFile: { type: String, attribute: "audio-file" },
  };

  constructor() {
    super();
    this.audioFile = "";
  }

  connectedCallback() {
    super.connectedCallback();

    this.audioElement = new Audio(this.audioFile);
    this.addEventListener("click", this.playAudioFile);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.playAudioFile);
  }

  async playAudioFile() {
    return this.audioElement.play();
  }

  render() {
    return html`<button>
      <slot></slot>
    </button>`;
  }
}
customElements.define("sound-button", SoundButton);
