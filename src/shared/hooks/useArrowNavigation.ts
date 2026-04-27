import { useCallback } from "preact/hooks";

/**
 * Hook to enable arrow key navigation between child elements of a container.
 * This is useful for accessibility roles like 'tablist', 'list', and 'radiogroup'.
 */
export function useArrowNavigation() {
	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		const target = e.target as HTMLElement;
		const container = target.parentElement;
		
		if (!container) return;

		// Get all focusable elements within the same group/role
		const items = Array.from(
			container.querySelectorAll<HTMLElement>(
				'button, [role="tab"], [role="listitem"], [role="radio"], input[type="range"]'
			)
		);

		if (items.length === 0) return;

		const index = items.indexOf(target);
		if (index === -1) return;

		let nextIndex = index;

		switch (e.key) {
			case "ArrowRight":
				if (index === items.length - 1) {
					// Check if we are in Sidebar, if so move to main content
					if (target.getAttribute("role") === "tab") {
						const mainContent = document.querySelector('[role="tabpanel"]');
						const firstFocusable = mainContent?.querySelector<HTMLElement>('button, [role="listitem"], [tabindex="0"]');
						if (firstFocusable) {
							firstFocusable.focus();
							e.preventDefault();
							return;
						}
					}
					nextIndex = 0;
				} else {
					nextIndex = index + 1;
				}
				e.preventDefault();
				break;
			case "ArrowLeft":
				if (index === 0) {
					// Check if we are in main content, if so move to sidebar
					const sidebar = document.querySelector('[role="tablist"]');
					const activeTab = sidebar?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
					if (activeTab && !sidebar?.contains(target)) {
						activeTab.focus();
						e.preventDefault();
						return;
					}
					nextIndex = items.length - 1;
				} else {
					nextIndex = index - 1;
				}
				e.preventDefault();
				break;
			case "ArrowDown":
				nextIndex = (index + 1) % items.length;
				e.preventDefault();
				break;
			case "ArrowUp":
				nextIndex = (index - 1 + items.length) % items.length;
				e.preventDefault();
				break;
			case "Home":
				nextIndex = 0;
				e.preventDefault();
				break;
			case "End":
				nextIndex = items.length - 1;
				e.preventDefault();
				break;
			default:
				return;
		}

		items[nextIndex]?.focus();
	}, []);

	return { handleKeyDown };
}
