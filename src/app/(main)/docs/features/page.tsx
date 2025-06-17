export default function FeaturesLayout() {
  return (
    <div style={{
      backgroundColor: '#0d1117',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      padding: '2rem',
      minHeight: '100vh',
    }}>
      <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #1f6feb',
          paddingBottom: '0.5rem'
        }}>
          Features
        </h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Explore the powerful features of our Website Builder designed to simplify and accelerate the process of building and managing websites.
        </p>

        <div style={{ lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ color: '#58a6ff' }}>🔐 Role-Based Access Control (RBAC)</h2>
            <p>Agencies and sub-accounts have clearly defined access levels to manage resources securely and efficiently.</p>
          </div>

          <div>
            <h2 style={{ color: '#58a6ff' }}>💻 Code Generation for Built Websites</h2>
            <p>Automatically generates source code for websites built with our platform, helping non-developers launch fully functional sites with ease.</p>
          </div>

          <div>
            <h2 style={{ color: '#58a6ff' }}>🛠️ Editor for Creating Websites</h2>
            <p>A user-friendly drag-and-drop editor that makes it simple to design and build websites visually—no coding required.</p>
          </div>

          <div>
            <h2 style={{ color: '#58a6ff' }}>🌐 Subdomain Hosting</h2>
            <p>Host your website on a custom subdomain for easy sharing, accessibility, and deployment without additional setup.</p>
          </div>

          <div>
            <h2 style={{ color: '#58a6ff' }}>📦 Inbuilt Templates</h2>
            <p>Quick-start your web projects using professional, pre-designed templates tailored for different use cases and industries.</p>
          </div>

          <div>
            <h2 style={{ color: '#58a6ff' }}>📋 Project Management Tool (Kanban Board)</h2>
            <p>Stay organized with an integrated Kanban board to manage tasks, track progress, and streamline your workflow.</p>
          </div>

          <div>
            <h2 style={{ color: '#58a6ff' }}>💳 Payment Integration</h2>
            <p>Enable and manage secure online payments directly from your website—perfect for e-commerce and service businesses.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
