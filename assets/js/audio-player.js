(() => {
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "--:--";

    const wholeSeconds = Math.floor(seconds);
    const minutes = Math.floor(wholeSeconds / 60);
    const remainder = wholeSeconds % 60;
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  };

  const initialize = (player) => {
    const audio = player.querySelector("audio");
    const controls = player.querySelector("[data-audio-controls]");
    const playButton = player.querySelector("[data-audio-play]");
    const playIcon = player.querySelector('[data-audio-icon="play"]');
    const pauseIcon = player.querySelector('[data-audio-icon="pause"]');
    const progress = player.querySelector("[data-audio-progress]");
    const time = player.querySelector("[data-audio-time]");

    if (
      !(audio instanceof HTMLAudioElement) ||
      !(controls instanceof HTMLElement) ||
      !(playButton instanceof HTMLButtonElement) ||
      !(progress instanceof HTMLInputElement) ||
      !(time instanceof HTMLOutputElement) ||
      !(playIcon instanceof SVGElement) ||
      !(pauseIcon instanceof SVGElement)
    ) {
      return;
    }

    let isScrubbing = false;

    // `duration` stays NaN until metadata loads, so formatTime can render --:--
    // instead of advertising a zero-length track (notably with preload="none").
    const paint = (currentTime, duration) => {
      const known = Number.isFinite(duration) && duration > 0;
      const percentage = known ? (Math.min(currentTime, duration) / duration) * 100 : 0;
      progress.style.setProperty("--audio-progress", `${percentage}%`);
      time.value = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    };

    const updateProgress = () => {
      const duration = audio.duration;
      const known = Number.isFinite(duration) && duration > 0;

      progress.max = String(known ? duration : 0);
      progress.disabled = !known;

      // While the user drags, the slider is the source of truth; letting
      // timeupdate write back would yank the thumb out from under the pointer.
      if (isScrubbing) return;

      const currentTime = known ? Math.min(audio.currentTime, duration) : audio.currentTime;
      progress.value = String(currentTime);
      paint(currentTime, duration);
    };

    const updatePlayback = () => {
      const isPlaying = !audio.paused && !audio.ended;
      playButton.setAttribute("aria-label", isPlaying ? "Pause story" : "Play story");
      playButton.dataset.state = isPlaying ? "playing" : "paused";
      playIcon.toggleAttribute("hidden", isPlaying);
      pauseIcon.toggleAttribute("hidden", !isPlaying);
    };

    playButton.addEventListener("click", () => {
      if (!audio.paused && !audio.ended) {
        audio.pause();
        return;
      }

      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => updatePlayback());
    });

    const beginScrub = () => {
      isScrubbing = true;
    };

    const endScrub = () => {
      if (!isScrubbing) return;
      isScrubbing = false;
      audio.currentTime = Number(progress.value);
      updateProgress();
    };

    progress.addEventListener("input", () => {
      const value = Number(progress.value);
      paint(value, audio.duration);
      audio.currentTime = value;
    });

    for (const eventName of ["pointerdown", "keydown"]) {
      progress.addEventListener(eventName, beginScrub);
    }
    for (const eventName of ["pointerup", "pointercancel", "keyup", "blur", "change"]) {
      progress.addEventListener(eventName, endScrub);
    }

    for (const eventName of ["loadedmetadata", "durationchange", "timeupdate", "seeking", "seeked", "ended"]) {
      audio.addEventListener(eventName, updateProgress);
    }
    for (const eventName of ["play", "pause", "ended"]) {
      audio.addEventListener(eventName, updatePlayback);
    }

    audio.controls = false;
    audio.hidden = true;
    controls.hidden = false;
    player.classList.add("story-audio--ready");
    updateProgress();
    updatePlayback();
    return true;
  };

  const start = () => {
    const players = Array.from(document.querySelectorAll("[data-audio-player]"));
    const ready = players.filter((player) => initialize(player));

    // The docked mobile player is a read-along affordance; plain audio posts keep
    // the inline card so they don't gain a bar that covers the end of the page.
    if (ready.length > 0 && document.querySelector("[data-read-along]")) {
      document.body.classList.add("has-story-audio-player");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
