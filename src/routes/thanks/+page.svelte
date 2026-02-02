<script lang="ts">
</script>

<svelte:head>
	<title>Thank You - Freeform</title>
</svelte:head>

<div class="container">
	<div class="card">
		<div class="icon">✓</div>
		<h1>Thank You!</h1>
		<p>Your submission has been received.</p>
	</div>
</div>

<style>
	.container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9fafb;
		padding: 1rem;
	}

	.card {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		text-align: center;
		max-width: 400px;
		width: 100%;
	}

	.icon {
		width: 64px;
		height: 64px;
		background: #d1fae5;
		color: #065f46;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		margin: 0 auto 1.5rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #111827;
		margin: 0 0 0.5rem;
	}

	p {
		color: #6b7280;
		margin: 0;
	}
</style>
