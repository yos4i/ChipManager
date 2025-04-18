function HistoryList({ history }) {
    return (
      <div style={boxStyle}>
        <h3>היסטוריה</h3>
        <ul style={listStyle}>
          {history.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>
    );
  }
  
  const boxStyle = {
    background: 'black',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 5px #ccc',
    flex: 1,
    minWidth: '300px'
  };
  
  const listStyle = {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: 0,
    listStyle: 'none'
  };
  
  export default HistoryList;
  