// src/ui/avatar.js - Skribbl.io Sprite Atlas Avatar Renderer & Customizer

import colorAtlasUrl from '../assets/avatar/color_atlas.gif';
import eyeAtlasUrl from '../assets/avatar/eye_atlas.gif';
import mouthAtlasUrl from '../assets/avatar/mouth_atlas.gif';
import crownUrl from '../assets/crown.gif';

export const AVATAR_LIMITS = {
  COLORS: 28,
  EYES: 57,
  MOUTHS: 51
};

export function getDefaultAvatar() {
  const saved = localStorage.getItem('uno_avatar');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (typeof parsed.color === 'number' && typeof parsed.eyes === 'number' && typeof parsed.mouth === 'number') {
        return parsed;
      }
    } catch (e) {
      // ignore
    }
  }
  return {
    color: Math.floor(Math.random() * AVATAR_LIMITS.COLORS),
    eyes: Math.floor(Math.random() * AVATAR_LIMITS.EYES),
    mouth: Math.floor(Math.random() * AVATAR_LIMITS.MOUTHS)
  };
}

export function saveAvatar(avatar) {
  localStorage.setItem('uno_avatar', JSON.stringify(avatar));
}

/**
 * Calculates CSS background-position and background-size for an avatar layer
 */
function getLayerStyle(atlasUrl, index, size = 48) {
  const col = index % 10;
  const row = Math.floor(index / 10);
  const posX = -col * size;
  const posY = -row * size;
  const bgSize = 10 * size;

  return `
    background-image: url('${atlasUrl}');
    background-position: ${posX}px ${posY}px;
    background-size: ${bgSize}px ${bgSize}px;
    background-repeat: no-repeat;
    image-rendering: pixelated;
  `;
}

/**
 * Renders an avatar into an HTML element or returns HTML string
 */
export function createAvatarElement(avatar = {}, size = 48, showCrown = false) {
  const color = avatar.color ?? 0;
  const eyes = avatar.eyes ?? 0;
  const mouth = avatar.mouth ?? 0;

  const el = document.createElement('div');
  el.className = `avatar avatar--size-${size}`;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.position = 'relative';
  el.style.overflow = 'visible';
  el.style.display = 'inline-block';
  el.style.verticalAlign = 'middle';
  el.style.flexShrink = '0';

  const colorLayer = document.createElement('div');
  colorLayer.className = 'avatar__layer avatar__layer--color';
  colorLayer.style.cssText = `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; ${getLayerStyle(colorAtlasUrl, color, size)}`;

  const eyeLayer = document.createElement('div');
  eyeLayer.className = 'avatar__layer avatar__layer--eye';
  eyeLayer.style.cssText = `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; ${getLayerStyle(eyeAtlasUrl, eyes, size)}`;

  const mouthLayer = document.createElement('div');
  mouthLayer.className = 'avatar__layer avatar__layer--mouth';
  mouthLayer.style.cssText = `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; ${getLayerStyle(mouthAtlasUrl, mouth, size)}`;

  el.appendChild(colorLayer);
  el.appendChild(eyeLayer);
  el.appendChild(mouthLayer);

  if (showCrown) {
    const crown = document.createElement('img');
    crown.src = crownUrl;
    crown.alt = 'Crown';
    crown.className = 'avatar__crown';
    crown.style.cssText = `
      position: absolute;
      top: -${Math.round(size * 0.28)}px;
      right: -${Math.round(size * 0.1)}px;
      width: ${Math.round(size * 0.52)}px;
      height: auto;
      transform: rotate(15deg);
      pointer-events: none;
      image-rendering: pixelated;
      z-index: 2;
    `;
    el.appendChild(crown);
  }

  return el;
}

/**
 * Updates an existing avatar container element
 */
export function updateAvatarElement(container, avatar = {}, size = 48, showCrown = false) {
  if (!container) return;
  container.innerHTML = '';
  const newAvatar = createAvatarElement(avatar, size, showCrown);
  while (newAvatar.firstChild) {
    container.appendChild(newAvatar.firstChild);
  }
}
