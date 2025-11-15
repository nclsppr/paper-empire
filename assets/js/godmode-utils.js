(function (rootFactory) {
  const factory = () => {
    function sanitizeTimeScale(scale, allowedScales = [1]) {
      const parsedScale = Number(scale);
      if (allowedScales.includes(parsedScale)) {
        return parsedScale;
      }
      return allowedScales[0];
    }

    function updateCheatProgress(currentBuffer = "", key, codeWord = "renard") {
      if (typeof codeWord !== "string" || !codeWord.length) {
        return { buffer: "", unlocked: false };
      }

      if (typeof key !== "string" || key.length !== 1) {
        return { buffer: currentBuffer, unlocked: false };
      }

      const nextChar = key.toLowerCase();
      if (nextChar < "a" || nextChar > "z") {
        return { buffer: "", unlocked: false };
      }

      const nextBuffer = (currentBuffer + nextChar).slice(-codeWord.length);
      return {
        buffer: nextBuffer,
        unlocked: nextBuffer === codeWord.toLowerCase()
      };
    }

    return {
      sanitizeTimeScale,
      updateCheatProgress
    };
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    const globalObject =
      typeof self !== "undefined"
        ? self
        : typeof window !== "undefined"
        ? window
        : globalThis;
    globalObject.GodModeUtils = factory();
  }
})();
