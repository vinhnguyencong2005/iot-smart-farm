function DataDisplay ({data}) {
    // data in format: [{properties: {title, icon, unit}, value}]
    return (
        <div className="data-display">
            {data.map((item, index) => (
                <Card key={index} properties={item.properties} value={item.value} />
            ))}
        </div>
    )
}

function Card ({properties, value}) {
    return (
        <div className="card">
            <h3>{properties.title}</h3>
            <div className="card-inner">
                <img src={properties.icon} alt={properties.title} width={40} height={40} style={{ objectFit: 'contain' }} />
                <p className="card-value">
                  {value != null ? `${value} ${properties.unit}` : '--'}
                </p>
            </div>
        </div>
    )
}
export default DataDisplay;