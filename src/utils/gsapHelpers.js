import { gsap } from 'gsap';
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * Ajoute une méthode fadeInBlur à une timeline GSAP pour simplifier les animations
 * de fade in avec blur et translation horizontale
 * 
 * @param {gsap.core.Timeline} timeline - La timeline GSAP à étendre
 * @returns {gsap.core.Timeline} - La timeline modifiée pour permettre le chaînage
 */
export function addFadeInOutBlur(timeline) {
  timeline.fadeInBlur = function(selector, options = {}) {
    const {
      x = 0,                    // Position x initiale (défaut: 0)
      blur = 5,                 // Intensité du blur initial (défaut: 5px)
      duration = 0.35,           // Durée de l'animation (défaut: 0.5s)
      ease = "power2.out",      // Type d'easing (défaut: power2.out)
      position,                  // Position dans la timeline (ex: "<+.15")
      scaleYBase = 1,            // Scale y initiale (défaut: 1)
      scaleYEnd = 1              // Scale y finale (défaut: 1)
    } = options;

    // Appel de fromTo avec les valeurs par défaut
    return this.fromTo(selector, {
      opacity: 0,
      filter: `blur(${blur}px)`,
      x: x,
      scaleY: scaleYBase,
    }, {
      opacity: 1,
      filter: "blur(0px)",
      x: 0,
      scaleY: scaleYEnd,
      duration: duration,
      ease: ease,
    }, position);
  };

  timeline.fadeOutBlur = function(selector, options = {}) {
    const {
      x = 0,                    // Position x initiale (défaut: 0)
      blur = 5,                 // Intensité du blur initial (défaut: 5px)
      duration = 0.35,           // Durée de l'animation (défaut: 0.5s)
      ease = "power2.out",      // Type d'easing (défaut: power2.out)
      position                  // Position dans la timeline (ex: "<+.15")
    } = options;
    return this.to(selector, {
      opacity: 0,
      filter: `blur(${blur}px)`,
      x: x,
      duration: duration,
      ease: ease,
    }, position);
  };
  return timeline;
}

/**
 * Animation fade in avec blur pour un élément
 * @param {string} selector - Sélecteur CSS de l'élément
 * @param {number|Object} durationOrOptions - Durée de l'animation (défaut: 1.5) ou options complètes
 * @param {number} delay - Délai avant l'animation (défaut: 0)
 * @param {number} blur - Intensité du blur initial (défaut: 20)
 * @param {gsap.core.Timeline} timeline - Timeline GSAP à utiliser (optionnel)
 * @param {string} position - Position dans la timeline (ex: "<+.15")
 * @returns {gsap.core.Tween|gsap.core.Timeline} - L'animation créée ou la timeline si fournie
 */
export function animHomeBlur(selector, durationOrOptions = 1.5, delay = 0, blur = 20, timeline = null, position = null) {
  // Support pour options en objet
  let duration = durationOrOptions;
  let options = {};
  if (typeof durationOrOptions === 'object' && durationOrOptions !== null) {
    options = durationOrOptions;
    duration = options.duration ?? 1.5;
    delay = options.delay ?? delay;
    blur = options.blur ?? blur;
    timeline = options.timeline ?? timeline;
    position = options.position ?? position;
  }

  const fromConfig = {
    filter: `blur(${blur}px)`,
    opacity: 0,
  };
  const toConfig = {
    opacity: 1,
    filter: "blur(0px)",
    duration: duration,
    scale: 1,
    delay: delay,
  };

  if (timeline) {
    return timeline.fromTo(selector, fromConfig, toConfig, position);
  } else {
    return gsap.fromTo(selector, fromConfig, toConfig);
  }
}

/**
 * Animation SplitText pour les caractères avec blur et stagger random
 * @param {string} selector - Sélecteur CSS de l'élément
 * @param {Object} options - Options d'animation
 * @param {number} options.duration - Durée de l'animation (défaut: 0.75)
 * @param {number} options.delay - Délai avant l'animation (défaut: 2)
 * @param {number} options.staggerAmount - Durée totale du stagger (défaut: 1)
 * @param {number} options.blur - Intensité du blur initial (défaut: 20)
 * @param {Object} options.scrollTrigger - Configuration du ScrollTrigger (optionnel)
 * @param {string} options.ease - Type d'easing (défaut: "power2.out")
 * @param {gsap.core.Timeline} options.timeline - Timeline GSAP à utiliser (optionnel)
 * @param {string} options.position - Position dans la timeline (ex: "<+.15")
 * @returns {Object|gsap.core.Timeline} - Objet contenant { split, animation, scrollTrigger } ou timeline si fournie
 */
export function animateSplitTextChars(selector, options = {}) {
  const {
    duration = 0.75,
    delay = 2,
    staggerAmount = 1,
    blur = 20,
    scrollTrigger,
    ease,
    timeline,
    position
  } = options;

  const split = SplitText.create(selector, {
    type: "chars, words"
  });

  const animationConfig = {
    opacity: 1,
    filter: "blur(0px)",
    duration: duration,
    scale: 1,
    delay: delay,
    stagger: {
      amount: staggerAmount,
      from: "random"
    }
  };

  let scrollTriggerInstance = null;
  if (scrollTrigger && !timeline) {
    animationConfig.scrollTrigger = scrollTrigger;
  }

  if (ease) {
    animationConfig.ease = ease;
  }

  let animation;
  if (timeline) {
    animation = timeline.fromTo(split.chars, {
      filter: `blur(${blur}px)`,
      opacity: 0,
    }, animationConfig, position);
    return timeline;
  } else {
    animation = gsap.fromTo(split.chars, {
      filter: `blur(${blur}px)`,
      opacity: 0,
    }, animationConfig);

    // Récupérer l'instance ScrollTrigger si elle existe
    if (scrollTrigger && animation.scrollTrigger) {
      scrollTriggerInstance = animation.scrollTrigger;
    }

    return { split, animation, scrollTrigger: scrollTriggerInstance };
  }
}

/**
 * Animation SplitText pour les mots avec blur et scroll trigger
 * @param {string} selector - Sélecteur CSS de l'élément
 * @param {Object} scrollTriggerConfig - Configuration du ScrollTrigger (peut être null si utilisé dans une timeline)
 * @param {Object} options - Options d'animation
 * @param {number} options.duration - Durée de l'animation (défaut: 0.75)
 * @param {number} options.delay - Délai avant l'animation (défaut: 2)
 * @param {number} options.staggerAmount - Durée totale du stagger (défaut: 1)
 * @param {number} options.blur - Intensité du blur initial (défaut: 5)
 * @param {gsap.core.Timeline} options.timeline - Timeline GSAP à utiliser (optionnel)
 * @param {string} options.position - Position dans la timeline (ex: "<+.15")
 * @returns {Object|gsap.core.Timeline} - Objet contenant { split, animation, scrollTrigger } ou timeline si fournie
 */
export function animateSplitTextWords(selector, scrollTriggerConfig, options = {}) {
  const {
    duration = 0.75,
    delay = 2,
    staggerAmount = 1,
    blur = 5,
    timeline,
    position
  } = options;

  const split = SplitText.create(selector, {
    type: "chars, words"
  });

  const animationConfig = {
    opacity: 1,
    filter: "blur(0px)",
    duration: duration,
    scale: 1,
    delay: delay,
    stagger: {
      amount: staggerAmount,
    }
  };

  if (scrollTriggerConfig && !timeline) {
    animationConfig.scrollTrigger = scrollTriggerConfig;
  }

  let animation;
  if (timeline) {
    animation = timeline.fromTo(split.words, {
      filter: `blur(${blur}px)`,
      opacity: 0,
    }, animationConfig, position);
    return timeline;
  } else {
    animation = gsap.fromTo(split.words, {
      filter: `blur(${blur}px)`,
      opacity: 0,
    }, animationConfig);

    const scrollTriggerInstance = animation.scrollTrigger || null;
    return { split, animation, scrollTrigger: scrollTriggerInstance };
  }
}

/**
 * Animation pour les éléments de navigation avec blur, scaleY et opacity
 * @param {string} selector - Sélecteur CSS de l'élément
 * @param {Object} scrollTriggerConfig - Configuration du ScrollTrigger (peut être null si utilisé dans une timeline)
 * @param {Object} options - Options d'animation
 * @param {number} options.duration - Durée de l'animation (défaut: 0.75)
 * @param {number} options.delay - Délai avant l'animation (défaut: 2)
 * @param {number} options.blur - Intensité du blur initial (défaut: 5)
 * @param {number} options.scaleYStart - Scale Y initiale (défaut: 0.5)
 * @param {number} options.gapStart - Gap initial (défaut: "4.5rem")
 * @param {number} options.gapEnd - Gap final (défaut: "5rem")
 * @param {string} options.ease - Type d'easing (défaut: "circ.out")
 * @param {gsap.core.Timeline} options.timeline - Timeline GSAP à utiliser (optionnel)
 * @returns {Object} - Objet contenant { animation, scrollTrigger, timeline }
 */
export function animateNav(selector, scrollTriggerConfig, options = {}) {
  const {
    duration = 0.75,
    delay = 2,
    blur = 5,
    scaleYStart = 0.5,
    gapStart = "4.5rem",
    gapEnd = "5rem",
    ease = "circ.out",
    timeline,
    position
  } = options;

  const animationConfig = {
    opacity: 1,
    filter: "blur(0px)",
    duration: duration,
    scaleY: 1,
    delay: delay,
    ease: ease,
    gap: gapEnd,
    stagger: {
      amount: 1,
      from: "random"
    }
  };

  if (scrollTriggerConfig && !timeline) {
    animationConfig.scrollTrigger = scrollTriggerConfig;
  }

  const fromToConfig = {
    filter: `blur(${blur}px)`,
    scaleY: scaleYStart,
    opacity: 0,
    gap: gapStart
  };

  if (timeline) {
    const animation = timeline.fromTo(selector, fromToConfig, animationConfig, position);
    return timeline; // Retourner la timeline pour permettre l'enchaînement
  } else {
    const animation = gsap.fromTo(selector, fromToConfig, animationConfig, position);
    return { animation, scrollTrigger: animation.scrollTrigger || null, timeline: null };
  }
}

/**
 * Animation pour un élément simple avec blur fade in
 * @param {string} selector - Sélecteur CSS de l'élément
 * @param {Object} scrollTriggerConfig - Configuration du ScrollTrigger (peut être null si utilisé dans une timeline)
 * @param {Object} options - Options d'animation
 * @param {number} options.duration - Durée de l'animation (défaut: 0.75)
 * @param {number} options.delay - Délai avant l'animation (défaut: 2)
 * @param {number} options.blur - Intensité du blur initial (défaut: 5)
 * @param {gsap.core.Timeline} options.timeline - Timeline GSAP à utiliser (optionnel)
 * @param {string} options.position - Position dans la timeline (ex: "<+.15")
 * @returns {Object|gsap.core.Timeline} - Objet contenant { animation, scrollTrigger } ou timeline si fournie
 */
export function animateBlurFadeIn(selector, scrollTriggerConfig, options = {}) {
  const {
    duration = 0.75,
    delay = 2,
    blur = 5,
    timeline,
    position
  } = options;

  const animationConfig = {
    opacity: 1,
    filter: "blur(0px)",
    duration: duration,
    scale: 1,
    delay: delay,
  };

  if (scrollTriggerConfig && !timeline) {
    animationConfig.scrollTrigger = scrollTriggerConfig;
  }

  if (timeline) {
    const animation = timeline.fromTo(selector, {
      filter: `blur(${blur}px)`,
      opacity: 0,
    }, animationConfig, position);
    return timeline;
  } else {
    const animation = gsap.fromTo(selector, {
      filter: `blur(${blur}px)`,
      opacity: 0,
    }, animationConfig);

    return { animation, scrollTrigger: animation.scrollTrigger || null };
  }
}

/**
 * Animation complexe pour le buttonContainer avec plusieurs étapes
 * @param {string} selector - Sélecteur CSS du container
 * @param {string} buttonSelector - Sélecteur CSS du bouton
 * @param {Object} scrollTriggerConfig - Configuration du ScrollTrigger
 */
export function animateButtonContainer(selector, buttonSelector, scrollTriggerConfig) {
  const buttonStartTl = gsap.timeline({ scrollTrigger: scrollTriggerConfig })
    .fromTo(selector, {
      opacity: 0,
      filter: 'blur(5px)',
    }, {
      opacity: 1,
      filter: 'blur(0px)',
      duration: 2,
      ease: "power2.out",
    })
    .fromTo(selector, {
      width: '0%',
    }, {
      width: 'auto',
      duration: .33,
      ease: "power2.out",
    }, "<+.25")
    .fromTo(buttonSelector, {
      transform: 'translateY(-100%)',
    }, {
      transform: 'translateY(0%)',
      duration: .5,
      ease: "power2.out",
    }, "<+.35");

  return buttonStartTl;
}

/**
 * Crée un ScrollTrigger avec gestion des événements
 * @param {Object} config - Configuration du ScrollTrigger
 * @param {string} config.trigger - Sélecteur CSS de l'élément trigger
 * @param {string} config.start - Position de départ (ex: '37% bottom')
 * @param {string} config.end - Position de fin (ex: '37% bottom')
 * @param {string} config.toggleActions - Actions de toggle (défaut: 'play none reverse none')
 * @param {Function} config.onEnter - Callback appelé lors de l'entrée
 * @param {Function} config.onEnterBack - Callback appelé lors de l'entrée en sens inverse
 * @param {Function} config.onLeave - Callback appelé lors de la sortie
 * @param {Function} config.onLeaveBack - Callback appelé lors de la sortie en sens inverse
 * @param {Function} config.onUpdate - Callback appelé à chaque update
 * @param {Function} config.onToggle - Callback appelé lors du toggle
 * @param {Object} config.additionalConfig - Configuration supplémentaire pour ScrollTrigger (scrub, pin, etc.)
 * @returns {Object} - Objet contenant { scrollTrigger }
 */
export function createScrollTrigger(config) {
  const {
    trigger,
    start,
    end,
    toggleActions = 'play none reverse none',
    onEnter,
    onEnterBack,
    onLeave,
    onLeaveBack,
    onUpdate,
    onToggle,
    additionalConfig = {}
  } = config;

  const scrollTriggerConfig = {
    trigger,
    start,
    end,
    toggleActions,
    ...additionalConfig
  };

  // Ajouter les callbacks s'ils sont fournis
  if (onEnter) scrollTriggerConfig.onEnter = onEnter;
  if (onEnterBack) scrollTriggerConfig.onEnterBack = onEnterBack;
  if (onLeave) scrollTriggerConfig.onLeave = onLeave;
  if (onLeaveBack) scrollTriggerConfig.onLeaveBack = onLeaveBack;
  if (onUpdate) scrollTriggerConfig.onUpdate = onUpdate;
  if (onToggle) scrollTriggerConfig.onToggle = onToggle;

  // Créer une timeline vide avec le ScrollTrigger pour pouvoir le récupérer
  const timeline = gsap.timeline({ scrollTrigger: scrollTriggerConfig });

  return { scrollTrigger: timeline.scrollTrigger, timeline };
}

/**
 * Crée plusieurs ScrollTriggers à partir d'un tableau de configurations
 * Utile pour créer plusieurs triggers avec des valeurs start/end prédéfinies
 * @param {string} triggerSelector - Sélecteur CSS commun pour tous les triggers
 * @param {Array} triggerConfigs - Tableau de configurations pour chaque trigger
 * @param {Object} triggerConfigs[].start - Position de départ
 * @param {Object} triggerConfigs[].end - Position de fin
 * @param {Object} triggerConfigs[].events - Objet contenant les callbacks (onEnter, onEnterBack, etc.)
 * @param {Object} triggerConfigs[].additionalConfig - Configuration supplémentaire
 * @param {string} defaultToggleActions - Actions de toggle par défaut (défaut: 'play none reverse none')
 * @returns {Array} - Tableau d'objets contenant { scrollTrigger, timeline }
 */
export function createMultipleScrollTriggers(triggerSelector, triggerConfigs, defaultToggleActions = 'play none reverse none') {
  return triggerConfigs.map(config => {
    const {
      start,
      end,
      events = {},
      additionalConfig = {},
      toggleActions = defaultToggleActions
    } = config;

    return createScrollTrigger({
      trigger: triggerSelector,
      start,
      end,
      toggleActions,
      onEnter: events.onEnter,
      onEnterBack: events.onEnterBack,
      onLeave: events.onLeave,
      onLeaveBack: events.onLeaveBack,
      onUpdate: events.onUpdate,
      onToggle: events.onToggle,
      additionalConfig
    });
  });
}

/**
 * Nettoie toutes les animations, timelines et ScrollTriggers
 * @param {Array} cleanupItems - Tableau d'objets contenant { split, animation, scrollTrigger, timeline }
 */
export function cleanupAnimations(cleanupItems = []) {
  cleanupItems.forEach(item => {
    if (!item) return;

    // Nettoyer SplitText
    if (item.split) {
      try {
        item.split.revert();
      } catch (e) {
        console.warn('Error reverting SplitText:', e);
      }
    }

    // Nettoyer ScrollTrigger
    if (item.scrollTrigger) {
      try {
        item.scrollTrigger.kill();
      } catch (e) {
        console.warn('Error killing ScrollTrigger:', e);
      }
    }

    // Nettoyer Timeline
    if (item.timeline) {
      try {
        item.timeline.kill();
      } catch (e) {
        console.warn('Error killing Timeline:', e);
      }
    }

    // Nettoyer Animation
    if (item.animation) {
      try {
        item.animation.kill();
      } catch (e) {
        console.warn('Error killing Animation:', e);
      }
    }
  });
}
