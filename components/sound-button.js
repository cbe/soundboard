import { LitElement, css, html } from "../dependencies/lit-core.min.js";

export class SoundButton extends LitElement {
  static properties = {
    audioFile: { type: String, attribute: "audio-file" },
    emoji: { type: String, attribute: "emoji" },
    repeatable: { type: Boolean, attribute: "repeatable" },

    _audioElement: { type: HTMLAudioElement, state: true },
  };

  static styles = css`
    button {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .content {
      flex: 1;
      align-self: stretch;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      text-align: center;
    }

    .text {
      pointer-events: none;
    }

    .progress {
      content: "";
      position: absolute;
      display: block;
      left: 0;
      bottom: 0;
      width: 0;
      opacity 0;
      height: 0.25rem;

      transition: width 0.25s ease-in;
    }
  `;

  constructor() {
    super();

    this.audioFile = "";
    this.emoji = "";
    this.repeatable = false;

    this._audioElement = undefined;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.playOrStopSound);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.playOrStopSound);
  }

  attributeChangedCallback(...args) {
    super.attributeChangedCallback(...args);

    if (this.audioFile) {
      // Stop any potential playing sound
      this._audioElement?.pause();
      if (this._progressBar) {
        this._progressBar.style.width = "0%";
      }

      this._audioElement = new Audio(this.audioFile);
      this._audioElement.addEventListener(
        "timeupdate",
        this.updateProgressBar.bind(this)
      );
    }
  }

  async playOrStopSound(event) {
    if ((this.audioFile && !this._audioElement) || this.repeatable) {
      this._audioElement = new Audio(this.audioFile);
      this._audioElement.addEventListener(
        "timeupdate",
        this.updateProgressBar.bind(this)
      );
    }

    const isPlaying = !this._audioElement.paused;
    if (isPlaying) {
      this._audioElement.pause();
      this._audioElement.currentTime = 0;
    } else {
      await this._audioElement.play();
    }
  }

  get _progressBar() {
    return this.renderRoot?.querySelector(".progress") ?? null;
  }

  updateProgressBar(event) {
    const { currentTime, duration } = this._audioElement;

    const percentage = (currentTime / duration) * 100;

    this._progressBar.style.width = `${percentage}%`;
    if (percentage == 100) {
      // Wait a little bit before resetting the progress bar
      window.setTimeout(() => {
        this._progressBar.style.width = "0%";
      }, 1000);
    }
  }

  render() {
    return html`
      <button part="button">
        <span part="content" class="content" draggable="true">
          ${this.emoji
            ? html`<span class="button-emoji">${this.emoji}</span>`
            : null}

          <span class="text">
            <slot></slot>
          </span>
        </span>

        <span part="progress" class="progress"></span>
      </button>
    `;
  }
}
customElements.define("sound-button", SoundButton);
