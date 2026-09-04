(() => {
  const aidPreferenceCookie = "read-along-aids";

  const parseJSON = (value) => {
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const readAidPreference = () => {
    const cookie = (document.cookie || "")
      .split("; ")
      .find((entry) => entry.startsWith(`${aidPreferenceCookie}=`));
    const value = cookie ? cookie.slice(aidPreferenceCookie.length + 1) : "both";

    if (value === "pinyin") return { pinyin: true, english: false };
    if (value === "english") return { pinyin: false, english: true };
    if (value === "none") return { pinyin: false, english: false };
    return { pinyin: true, english: true };
  };

  const saveAidPreference = (preference) => {
    let value = "none";
    if (preference.pinyin && preference.english) value = "both";
    else if (preference.pinyin) value = "pinyin";
    else if (preference.english) value = "english";

    document.cookie = `${aidPreferenceCookie}=${value}; Path=/; SameSite=Lax`;
  };

  const initialize = (readAlong) => {
    const audio = document.getElementById(readAlong.dataset.audioId);
    const sentences = Array.from(readAlong.querySelectorAll("[data-read-along-index]"));
    const starts = parseJSON(readAlong.dataset.starts);
    const pinyin = parseJSON(readAlong.dataset.pinyin);
    const english = parseJSON(readAlong.dataset.english);

    if (
      !(audio instanceof HTMLAudioElement) ||
      !Array.isArray(starts) ||
      starts.length !== sentences.length ||
      starts.some((start, index) =>
        !Number.isFinite(start) || start < 0 || (index > 0 && start <= starts[index - 1])
      )
    ) {
      return;
    }

    const annotation = readAlong.querySelector("[data-read-along-annotation]");
    const toggles = readAlong.querySelector(".read-along__toggles");
    const playerAids = audio
      .closest("[data-audio-player]")
      ?.querySelector("[data-audio-aids]");
    const toggleButtons = Array.from(readAlong.querySelectorAll("[data-read-along-toggle]"));
    const aidRows = {
      pinyin: annotation?.querySelector('[data-read-along-aid="pinyin"]'),
      english: annotation?.querySelector('[data-read-along-aid="english"]'),
    };
    const aidsAvailable =
      Array.isArray(pinyin) &&
      Array.isArray(english) &&
      pinyin.length === sentences.length &&
      english.length === sentences.length &&
      pinyin.every((value) => typeof value === "string" && value.length > 0) &&
      english.every((value) => typeof value === "string" && value.length > 0) &&
      annotation &&
      aidRows.pinyin &&
      aidRows.english &&
      toggleButtons.length === 2;

    let activeIndex = -1;
    let hoverIndex = -1;
    let focusIndex = -1;
    let hasPosition = false;
    let shownSignature = "";
    let focusedSentence = null;
    let annotationFrame = 0;
    const enabledAids = readAidPreference();

    const hasEnabledAid = () => enabledAids.pinyin || enabledAids.english;

    const syncDescription = () => {
      sentences.forEach((sentence) => sentence.removeAttribute("aria-describedby"));
      if (aidsAvailable && hasEnabledAid() && focusedSentence) {
        focusedSentence.setAttribute("aria-describedby", annotation.id);
      }
    };

    const scheduleAnnotationPosition = () => {
      if (!aidsAvailable || annotation.hidden || annotationFrame) return;

      annotationFrame = window.requestAnimationFrame(() => {
        annotationFrame = 0;
        renderAnnotation();
      });
    };

    const positionAnnotation = (index) => {
      const sentence = sentences[index];
      if (
        typeof sentence.getBoundingClientRect !== "function" ||
        typeof readAlong.getBoundingClientRect !== "function" ||
        !annotation.style
      ) {
        return;
      }

      const fragments =
        typeof sentence.getClientRects === "function" ? sentence.getClientRects() : [];
      const firstAnchor = fragments.length
        ? fragments[0]
        : sentence.getBoundingClientRect();
      const lastAnchor = fragments.length
        ? fragments[fragments.length - 1]
        : sentence.getBoundingClientRect();
      const container = readAlong.getBoundingClientRect();
      const gutter = 8;
      const gap = 6;
      const width = annotation.offsetWidth;
      const height = annotation.offsetHeight;
      if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) return;

      const centeredLeft = lastAnchor.left - container.left + lastAnchor.width / 2 - width / 2;
      const maximumLeft = Math.max(gutter, container.width - width - gutter);
      const player = audio.closest("[data-audio-player]")?.querySelector("[data-audio-controls]");
      const viewportBottom = window.innerHeight;
      const playerTop =
        player instanceof HTMLElement && window.getComputedStyle(player).position === "fixed"
          ? player.getBoundingClientRect().top
          : viewportBottom;
      const availableBottom = Math.min(viewportBottom, playerTop) - gutter;
      const belowTop = lastAnchor.bottom - container.top + gap;
      const aboveTop = firstAnchor.top - container.top - gap - height;
      const belowBottom = container.top + belowTop + height;
      const minimumTop = gutter - container.top;
      const maximumTop = availableBottom - container.top - height;
      let top = belowTop;

      if (belowBottom > availableBottom) {
        top = Math.max(minimumTop, Math.min(aboveTop, maximumTop));
      }

      annotation.style.left = `${Math.min(Math.max(centeredLeft, gutter), maximumLeft)}px`;
      annotation.style.top = `${top}px`;
    };

    const renderAnnotation = () => {
      if (!aidsAvailable) return;

      const displayIndex = focusIndex >= 0 ? focusIndex : hoverIndex >= 0 ? hoverIndex : activeIndex;
      if (displayIndex < 0 || !hasEnabledAid()) {
        annotation.hidden = true;
        shownSignature = "";
        return;
      }

      for (const aid of ["pinyin", "english"]) {
        const row = aidRows[aid];
        row.hidden = !enabledAids[aid];
        if (enabledAids[aid]) {
          row.querySelector("[data-read-along-aid-text]").textContent =
            aid === "pinyin" ? pinyin[displayIndex] : english[displayIndex];
        }
      }

      annotation.hidden = false;
      positionAnnotation(displayIndex);
      const signature = `${displayIndex}:${enabledAids.pinyin}:${enabledAids.english}`;
      if (signature !== shownSignature) {
        annotation.classList.remove("is-updating");
        void annotation.offsetWidth;
        annotation.classList.add("is-updating");
        shownSignature = signature;
      }
    };

    const setActive = (nextIndex) => {
      if (nextIndex === activeIndex) return;

      if (activeIndex >= 0) {
        sentences[activeIndex].classList.remove("is-active");
        sentences[activeIndex].removeAttribute("aria-current");
      }

      activeIndex = nextIndex;

      if (activeIndex >= 0) {
        sentences[activeIndex].classList.add("is-active");
        sentences[activeIndex].setAttribute("aria-current", "true");
      }

      renderAnnotation();
    };

    const sentenceAt = (time) => {
      let low = 0;
      let high = starts.length - 1;
      let match = -1;

      while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if (starts[middle] <= time) {
          match = middle;
          low = middle + 1;
        } else {
          high = middle - 1;
        }
      }

      return match;
    };

    const update = () => {
      if (!hasPosition && audio.paused && audio.currentTime === 0) return;
      hasPosition = true;
      setActive(sentenceAt(audio.currentTime));
    };

    const playFrom = (index) => {
      hasPosition = true;
      audio.currentTime = starts[index];
      update();
      audio.play().catch(() => {});
    };

    sentences.forEach((sentence, index) => {
      sentence.setAttribute("role", "button");
      sentence.setAttribute("tabindex", "0");
      sentence.addEventListener("click", () => playFrom(index));
      sentence.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        playFrom(index);
      });
      sentence.addEventListener("mouseenter", () => {
        hoverIndex = index;
        renderAnnotation();
      });
      sentence.addEventListener("mouseleave", () => {
        hoverIndex = -1;
        renderAnnotation();
      });
      sentence.addEventListener("focus", () => {
        focusIndex = index;
        focusedSentence = sentence;
        syncDescription();
        renderAnnotation();
      });
      sentence.addEventListener("blur", () => {
        focusIndex = -1;
        focusedSentence = null;
        syncDescription();
        renderAnnotation();
      });
    });

    if (aidsAvailable) {
      // Reveal the toggles even when the audio player script never ran, so the
      // tooltip can always be turned off; docking into the player is a bonus.
      if (toggles instanceof HTMLElement) {
        if (playerAids instanceof HTMLElement) {
          playerAids.append(toggles);
          playerAids.hidden = false;
        }
        toggles.hidden = false;
      }

      toggleButtons.forEach((button) => {
        const aid = button.dataset.readAlongToggle;
        button.setAttribute("aria-pressed", String(enabledAids[aid]));
        button.classList.toggle("is-enabled", enabledAids[aid]);
        button.addEventListener("click", () => {
          enabledAids[aid] = !enabledAids[aid];
          button.setAttribute("aria-pressed", String(enabledAids[aid]));
          button.classList.toggle("is-enabled", enabledAids[aid]);
          saveAidPreference(enabledAids);
          syncDescription();
          renderAnnotation();
        });
      });
    }

    audio.addEventListener("play", update);
    audio.addEventListener("timeupdate", update);
    audio.addEventListener("seeking", update);
    audio.addEventListener("seeked", update);
    audio.addEventListener("ended", () => {
      hasPosition = false;
      setActive(-1);
    });
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", scheduleAnnotationPosition, { passive: true });
      window.addEventListener("resize", scheduleAnnotationPosition);
      window.visualViewport?.addEventListener("scroll", scheduleAnnotationPosition, { passive: true });
      window.visualViewport?.addEventListener("resize", scheduleAnnotationPosition);
    }

    readAlong.classList.add("read-along--ready");
  };

  const start = () => document.querySelectorAll("[data-read-along]").forEach(initialize);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
