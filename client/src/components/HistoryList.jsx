function HistoryList({ history }) {
    return (
        <div style={sectionBoxStyle}>
            <h2 style={sectionTitleStyle}>היסטוריה</h2>
            <ul style={listStyle}>
                {history.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    );
}

const sectionBoxStyle = {
    background: '#1a1a1a',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    color: '#ffffff',
    marginBottom: '1rem',
    marginTop: '2rem',
    minWidth: '300px'
};

const sectionTitleStyle = {
    textAlign: 'center',
    color: '#fff',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    borderBottom: '1px solid #d4af37',
    paddingBottom: '0.5rem'
};

const listStyle = {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: 0,
    listStyle: 'none',
    textAlign: 'center'
};

export default HistoryList;
