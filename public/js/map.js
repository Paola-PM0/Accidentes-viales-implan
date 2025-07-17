//const { get, validateHeaderName } = require("node:http");

let map;
let wfsLayer;
let chart;
let chartBarra;

// Función para cargar datos y crear el mapa  
function initMap() {
    map = L.map('map').setView([19.7036, -101.1926], 12);  
    // Añadir capa de mapa base 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {  
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    //capa de wms traida desde geoserver 
    wmsLayer = L.tileLayer.wms("https://geoaccidentes.duckdns.org/geoserver/ne/wms", {
        layers: 'ne:Accidentes_2018_2024',
        format: 'image/png',
        transparent: true,
        /*CQL_FILTER: "circunstan =  'no guardo distancia'",*/
        version: '1.1.0', 
        attribution: 'GeoServer WMS'
    }).addTo(map);

    //http://localhost:8080/geoserver/Accidentes/wms url local
    //el otro 
    //http://44.204.60.238:8080/geoserver/ne/wms

    // para filtar con CQL
    document.getElementById('tipoAccidente').addEventListener('change', (event) => {
        const tipoSelecionado = event.target.value;

        map.removeLayer(wmsLayer);

        //filtro para CQL
        let cqlFilter = "";
        
        if(tipoSelecionado !== "Todos"){
            cqlFilter = `circunstancias = '${tipoSelecionado}'`;     
        }
        wmsLayer = L.tileLayer.wms('https://geoaccidentes.duckdns.org/geoserver/ne/wms', {
            layers: 'ne:Accidentes_2018_2024',
            format: 'image/png',
            transparent: true,
            CQL_FILTER: cqlFilter,
            version: '1.1.0',
            attribution: 'GeoServer WMS'
        }).addTo(map);
        /*cargarWFS(cqlFilter);*/
        actualizarGrafica(tipoSelecionado);
    });


    //POP
    //funcion para mostrar informacion del punto 
    map.on('click', function (e) {  //donde e es la ubicacion del punto
    const url = getFeatureInfoUrl(map, wmsLayer, e.latlng, 'application/json');  //'text/html' ultimo parametro define como retorna la informacion
    fetch(url)
        .then(response => response.json()) 
        .then(data => {
            // Asegurar de que haya al menos una "feature"
            if (data.features.length > 0) {
                const props = data.features[0].properties;
        
                
                const circunstancia = props.circunstancias || "Sin circunstancia";
                const hora = props.hora || "Sin hora";
                const domicilio = props.domicilio || "Sin domicilio";
                const contenido = `<strong>Hora:</strong> ${hora}<br><strong>Situación:</strong> ${circunstancia}<br><strong>Domicilio:</strong> ${domicilio}`;
        
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent(contenido)
                    .openOn(map);
            } else {
                L.popup()
                    .setLatLng(e.latlng)
                    .setContent("No hay información aquí.")
                    .openOn(map);
            }
            //console.log(data.features[0].properties);
        })
    });

    //Funcion que obtiene la informacion para construir la url completa para realizar una consulta WMS GetFeatureInfo,
    function getFeatureInfoUrl(map, layer, latlng, params = {}) {
    const point = map.latLngToContainerPoint(latlng, map.getZoom());
    const size = map.getSize();

    const baseUrl = layer._url;

    const defaultParams = {
        request: 'GetFeatureInfo',
        service: 'WMS',
        srs: 'EPSG:4326',
        styles: '',
        transparent: true,
        version: layer.wmsParams.version,
        format: layer.wmsParams.format,
        bbox: map.getBounds().toBBoxString(),
        height: size.y,
        width: size.x,
        layers: layer.wmsParams.layers,
        query_layers: layer.wmsParams.layers,
        info_format: 'application/json',
        x: Math.floor(point.x),
        y: Math.floor(point.y)
    };

    const finalParams = new URLSearchParams(Object.assign({}, defaultParams, params));
    return `${baseUrl}?${finalParams.toString()}`;
    }

}

/*
//Asinconrna para que el codigo se espere xd
async function actualizarGrafica(tipoSelecionado) {

    //antes en local:  http://localhost:8080/geoserver/Accidentes/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Accidentes:Accidentes_2018_2024&outputFormat=application/json
    //const url = `https://geoaccidentes.duckdns.org/geoserver/ne/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne%3AAccidentes_2018_2024&outputFormat=application%2Fjson`;
    const url = 'https://api-geoaccidentes.duckdns.org/api/datos';
                
    try {
        const response = await fetch(url); //se envia la solicitud o sea la peticion  y la guardo para despues convertira a JSON 
        const data = await response.json();  //en data guardo todo el JSON que se obtiene de la peticion, son await porque el codigo no avanzar 
        //hasta que se recibio la peticion 
        console.log("datos:",data);
        const cuentaTipos = {}; //arrego para contar los accidentes por tipo 

        data.forEach(item=> { //aceder a cada objeto del arreglo de objetos
            //console.log("item",item);
            //const tipo = item.circunstancias || "Desconocido";
            //entaTipos[tipo] || 0) + 1;
            cuentaTipos[item.tipo || "Desconocido"] = item.total;
        });

        let labels = [];
        let valores = [];

        if (tipoSelecionado === "Todos") {
            // Mostrar todos los tipos
            labels = Object.keys(cuentaTipos);
            valores = Object.values(cuentaTipos);
        } else {
            const seleccionados = cuentaTipos[tipoSelecionado] || 0;
            const otros = Object.values(cuentaTipos).reduce((a, b) => a + b, 0) - seleccionados;
            labels = [tipoSelecionado, "Otros"];
            valores = [seleccionados, otros];
        }

        renderizarGrafica(labels, valores);

    } catch (error) {
        console.error("Error al obtener datos para la gráfica:", error);
    }
}
*/


async function actualizarGrafica(tipoSelecionado) {
    const url = tipoSelecionado === "Todos"
        ? 'https://api-geoaccidentes.duckdns.org/api/datos'
        : `https://api-geoaccidentes.duckdns.org/api/datos?tipo=${encodeURIComponent(tipoSelecionado)}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        let labels = [];  
        let valores = [];

        if (tipoSelecionado === "Todos") {
            const cuentaTipos = {};
            data.forEach(item => {
                cuentaTipos[item.tipo || "Desconocido"] = item.total;
            });

            labels = Object.keys(cuentaTipos);
            valores = Object.values(cuentaTipos);
        } else {
            const seleccionados = data[0]?.total || 0;

            // Necesitamos saber el total general para restar "Otros"
            // Lo puedes calcular una sola vez al cargar la página, o
            // puedes almacenarlo como variable global, pero aquí lo traeremos nuevamente:

            const totalResponse = await fetch('https://api-geoaccidentes.duckdns.org/api/datos');
            const totalData = await totalResponse.json();
            const totalGlobal = totalData.reduce((sum, item) => sum + item.total, 0);

            const otros = totalGlobal - seleccionados;

            labels = [tipoSelecionado, "Otros"];
            valores = [seleccionados, otros];
        }

        renderizarGrafica(labels, valores);

    } catch (error) {
        console.error("Error al obtener datos para la gráfica:", error);
    }
}

function renderizarGrafica(labels, data) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');

    if (chart) chart.destroy(); // Destruye la gráfica anterior si existe

    const total = data.reduce((a, b) => a + b, 0);

    // Mostrar total en el div
    document.getElementById('totalAccidentes').innerText = `Total de accidentes: ${total}`;

    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Accidentes por tipo',
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#66BB6A', '#BA68C8', '#FFA726', '#8D6E63'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const valor = context.parsed;
                            const porcentaje = ((valor / total) * 100).toFixed(1);
                            return `${context.label}: ${valor} (${porcentaje}%)`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Distribución de accidentes por tipo'
                }
            }
        }
    });
}


async function actualizarGraficaBarras(){
    try {
        const response = await fetch('https://api-geoaccidentes.duckdns.org/api/graficoBarras');  //peticion http a la api, <- se espera a que termine de hacer la op y se guarda en response
        const data = await response.json();

        let labels =[];
        let valores = [];        

        data.forEach(item=>{
            labels.push(item.tipo || 'desconocido');
            valores.push(item.total);
        });
        
        renderizarGraficaBarras(labels, valores);
    } catch (error) {
        console.error('error',error);
    }     
}
//Grafica barras 
function renderizarGraficaBarras(labels, data){
    const ctx = document.getElementById('hourlyChartbarras').getContext('2d');

    if (chartBarra) chartBarra.destroy();

    const total = data.reduce((a,b)=> a + b, 0 );
    document.getElementById('totalAccidentes').innerText = `Total de accidentes: ${total}`;
    
    chartBarra = new Chart (ctx, {
        type: 'bar',

        data: { 
            labels: labels,
            datasets: [{
                label: 'Accidente por tipo',
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#66BB6A', '#BA68C8', '#FFA726', '#8D6E63'],
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1
            }]
        },

        options: { 
            responsive: true,
            scales:{
                y: {
                    beginAtZero: true,
                    //activa la visualizacion eje x o y 
                    title: {display: true, text: 'Total'},
                },
                x: {
                    beginAtZero: true,                   
                    title : {display: true, text: 'Tipo de Accidentes'},
                }
            }
        },
        plugins: {
            legend: {display: false},
            title:  {display: true, text: 'Tipo de Accidentes'},
        },
        //cuadro emergente visualizacion mouse encima
        tooltip: {
            callbacks: {
                label: function(context){
                    const valor = context.parsed.y;
                    return `${context.label}: ${valor}`;
                }
            }
        }

    });
}

async function listaCiudades(){
    try {
        const response = await fetch('https://api-geoaccidentes.duckdns.org/api/ciudad');
        const date = await response.json();

        labels = [];
        valores = [];
        
        date.forEach(item => {
            labels.push(item.ciudad || 'desconocido');
            valores.push(item.total);
        });
        
        crearLista(labels, valores);

    } catch (error) {
        console.log("hubo un error", error);
    }
}

function crearLista(labels, valores){
    const lista = document.getElementById('list');
    lista.innerHTML = '';

    //recorrer la lista

    for (let i = 0; i < labels.length; i++) {
        const crearli = document.createElement('li');
        crearli.textContent = `${labels[i]}: ${valores[i]} accidentes`;
        lista.appendChild(crearli);
        
    }

}


// Inicializar el mapa al cargar la página

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    actualizarGraficaBarras(); // <-- Aquí se genera la gráfica de barras automáticamente
    listaCiudades();
});

