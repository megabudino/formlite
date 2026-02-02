<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let { children } = $props();
	let loggingOut = $state(false);

	async function handleLogout() {
		loggingOut = true;
		try {
			await authClient.signOut();
			goto('/auth/login');
		} catch (err) {
			console.error('Logout failed:', err);
			loggingOut = false;
		}
	}
</script>

<div class="app-layout">
	<header class="app-header">
		<div class="header-content">
			<a href="/app" class="logo">Freeform</a>
			<button class="logout-btn" onclick={handleLogout} disabled={loggingOut}>
				{loggingOut ? 'Logging out...' : 'Logout'}
			</button>
		</div>
	</header>
	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f5f5f5;
	}

	.app-header {
		background-color: white;
		border-bottom: 1px solid #e5e5e5;
		padding: 0 1rem;
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 60px;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: #333;
		text-decoration: none;
	}

	.logo:hover {
		color: #3b82f6;
	}

	.logout-btn {
		padding: 0.5rem 1rem;
		background-color: transparent;
		color: #666;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-btn:hover:not(:disabled) {
		background-color: #f3f4f6;
		border-color: #ccc;
		color: #333;
	}

	.logout-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.app-main {
		flex: 1;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
		width: 100%;
		box-sizing: border-box;
	}
</style>
