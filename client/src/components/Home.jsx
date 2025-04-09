function Home({ onGuestLogin }) {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', paddingTop: '5rem' }}>
      <h1>🎉 ברוך הבא לאפליקציית הפוקר</h1>
      <p>המשך כדי להיכנס כאורח:</p>


    </div>
  );
}

const buttonStyle = {
  padding: '12px 24px',
  fontSize: '18px',
  background: '#4CAF50',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
};

export default Home;
