(() => {
  const rateCookie = "story-audio-rate";
  // Cycle order, not sort order: a learner's first tap should slow the story.
  const rates = [1, 0.75, 0.5, 1.5, 1.25];

  const readRate = () => {
    const cookie = (document.cookie || "")
      .split("; ")
      .find((entry) => entry.startsWith(`${rateCookie}=`));
    const value = cookie ? Number(cookie.slice(rateCookie.length + 1)) : 1;

    return rates.includes(value) ? value : 1;
  };

  const saveRate = (rate) => {
    document.cookie = `${rateCookie}=${rate}; Path=/; SameSite=Lax`;
  };

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
    const rateButton = player.querySelector("[data-audio-rate]");
    const muteButton = player.querySelector("[data-audio-mute]");
    const volumeIcon = player.querySelector('[data-audio-icon="volume"]');
    const mutedIcon = player.querySelector('[data-audio-icon="muted"]');
    const sources = Array.from(audio?.querySelectorAll("source") || []);

    if (
      !(audio instanceof HTMLAudioElement) ||
      !(controls instanceof HTMLElement) ||
      !(playButton instanceof HTMLButtonElement) ||
      !(progress instanceof HTMLInputElement) ||
      !(time instanceof HTMLOutputElement) ||
      !(rateButton instanceof HTMLButtonElement) ||
      !(muteButton instanceof HTMLButtonElement) ||
      !(playIcon instanceof SVGElement) ||
      !(pauseIcon instanceof SVGElement) ||
      !(volumeIcon instanceof SVGElement) ||
      !(mutedIcon instanceof SVGElement)
    ) {
      return;
    }

    let isScrubbing = false;
    let hasError = false;

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
      progress.disabled = hasError || !known;

      if (hasError) {
        time.value = "Audio unavailable";
        return;
      }

      // While the user drags, the slider is the source of truth; letting
      // timeupdate write back would yank the thumb out from under the pointer.
      if (isScrubbing) return;

      const currentTime = known ? Math.min(audio.currentTime, duration) : audio.currentTime;
      progress.value = String(currentTime);
      paint(currentTime, duration);
    };

    const updatePlayback = () => {
      rateButton.disabled = hasError;
      muteButton.disabled = hasError;

      if (hasError) {
        playButton.disabled = true;
        playButton.setAttribute("aria-label", "Audio unavailable");
        playButton.dataset.state = "error";
        playIcon.hidden = false;
        pauseIcon.hidden = true;
        return;
      }

      playButton.disabled = false;
      const isPlaying = !audio.paused && !audio.ended;
      playButton.setAttribute("aria-label", isPlaying ? "Pause story" : "Play story");
      playButton.dataset.state = isPlaying ? "playing" : "paused";
      playIcon.toggleAttribute("hidden", isPlaying);
      pauseIcon.toggleAttribute("hidden", !isPlaying);
    };

    const updateRate = () => {
      const label = `${audio.playbackRate}×`;
      rateButton.textContent = label;
      rateButton.setAttribute("aria-label", `Playback speed ${label}`);
    };

    const updateMute = () => {
      muteButton.setAttribute("aria-label", audio.muted ? "Unmute story" : "Mute story");
      volumeIcon.toggleAttribute("hidden", audio.muted);
      mutedIcon.toggleAttribute("hidden", !audio.muted);
    };

    // The default rate is what the browser falls back to whenever it reloads the
    // media, so setting only playbackRate could silently snap back to 1×.
    const setRate = (rate) => {
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
    };

    const markUnavailable = () => {
      hasError = true;
      audio.pause();
      player.classList.add("story-audio--error");
      updateProgress();
      updatePlayback();
    };

    const clearUnavailable = () => {
      if (!hasError) return;
      hasError = false;
      player.classList.remove("story-audio--error");
      updateProgress();
      updatePlayback();
    };

    playButton.addEventListener("click", () => {
      if (!audio.paused && !audio.ended) {
        audio.pause();
        return;
      }

      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => {
        if (audio.error) markUnavailable();
        else updatePlayback();
      });
    });

    rateButton.addEventListener("click", () => {
      const next = rates[(rates.indexOf(audio.playbackRate) + 1) % rates.length];
      setRate(next);
      saveRate(next);
    });

    muteButton.addEventListener("click", () => {
      audio.muted = true;
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

    for (const eventName of ["durationchange", "timeupdate", "seeking", "seeked", "ended"]) {
      audio.addEventListener(eventName, updateProgress);
    }
    audio.addEventListener("loadedmetadata", () => {
      clearUnavailable();
      updateProgress();
    });
    audio.addEventListener("error", markUnavailable);
    sources.forEach((source) => source.addEventListener("error", markUnavailable));
    for (const eventName of ["play", "pause", "ended"]) {
      audio.addEventListener(eventName, updatePlayback);
    }
    audio.addEventListener("ratechange", updateRate);
    audio.addEventListener("volumechange", updateMute);

    setRate(readRate());
    updateRate();
    updateMute();

    audio.controls = false;
    audio.hidden = true;
    controls.hidden = false;
    player.classList.add("story-audio--ready");
    if (audio.error) markUnavailable();
    else {
      updateProgress();
      updatePlayback();
    }
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
