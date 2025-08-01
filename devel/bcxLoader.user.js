// ==UserScript==
// @name         BCX - Bondage Club Extended (Loader)
// @namespace    BCX
// @version      2.0.6
// @description  Loader of Jomshir's "Bondage Club Extended" mod
// @author       Jomshir98
// @include      /^https:\/\/(www\.)?bondageprojects\.elementfx\.com\/R\d+\/(BondageClub|\d+)(\/((index|\d+)\.html)?)?$/
// @include      /^https:\/\/(www\.)?bondage-europe\.com\/R\d+\/(BondageClub|\d+)(\/((index|\d+)\.html)?)?$/
// @include      /^https:\/\/(www\.)?bondage-asia\.com\/R\d+\/(Club|\d+)(\/((index|\d+)\.html)?)?$/
// @homepage     https://github.com/jomshir98/bondage-club-extended#readme
// @source       https://github.com/jomshir98/bondage-club-extended
// @downloadURL  https://jomshir98.github.io/bondage-club-extended/devel/bcxLoader.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

// eslint-disable-next-line no-restricted-globals
setTimeout(
	function () {
		if (window.BCX_Loaded === undefined) {
			const n = document.createElement("script");
			n.setAttribute("language", "JavaScript");
			n.setAttribute("crossorigin", "anonymous");
			n.setAttribute("src", "https://jomshir98.github.io/bondage-club-extended/devel/bcx.js?_=" + Date.now());
			n.onload = () => n.remove();
			document.head.appendChild(n);
		}
	},
	2000
);
