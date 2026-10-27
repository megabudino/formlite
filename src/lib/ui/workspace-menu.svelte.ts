// Shared UI state between the app layout, WorkspaceShell and workspace pages.
// Only written in the browser (onMount / click handlers), so it never leaks between SSR requests.
export const workspaceMenu = $state({
	/** How many WorkspaceShells are mounted. A counter, because during navigation the next
	    page's shell can mount before the previous one is destroyed. */
	shells: 0,
	/** The phone drawer (opened by the top bar's hamburger) */
	open: false,
	/** The "New form" dialog */
	newForm: false
});
