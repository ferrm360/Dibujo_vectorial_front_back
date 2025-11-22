const svgBoard = document.getElementById('drawing-board');
let mainLayer = document.getElementById('mainLayer'); 
let bgLayer = document.getElementById('bgLayer');

const layersList = document.getElementById('layersList');
const inputs = {
    fill: document.getElementById('fillColor'),
    stroke: document.getElementById('strokeColor'),
    width: document.getElementById('strokeWidth'),
    sides: document.getElementById('numSides'),
    geoW: document.getElementById('geoW'),
    geoH: document.getElementById('geoH')
};

let state = {
    tool: 'select',
    isDrawing: false,
    isDragging: false,
    startX: 0, startY: 0,
    selectedEl: null, 
    dragOffsetX: 0, dragOffsetY: 0
};

const SVG_NS = "http://www.w3.org/2000/svg";

document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (btn.id === 'deleteBtn') return handleDelete(); 
        
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tool = btn.dataset.tool;
        
        deselect();
    });
});

document.getElementById('bgLoader').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        bgLayer.innerHTML = '';
        const img = document.createElementNS(SVG_NS, 'image');
        img.setAttributeNS(null, 'href', event.target.result);
        img.setAttributeNS(null, 'width', '100%');
        img.setAttributeNS(null, 'height', '100%');
        img.setAttributeNS(null, 'preserveAspectRatio', 'none'); 
        bgLayer.appendChild(img);
    };
    reader.readAsDataURL(file);
});


function getMousePos(evt) {
    const CTM = svgBoard.getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
}

svgBoard.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    state.startX = pos.x;
    state.startY = pos.y;

    if (state.tool === 'select') {
        if (e.target.tagName !== 'svg' && e.target.closest('g') === mainLayer) {
            selectShape(e.target);
            state.isDragging = true;
            const bbox = state.selectedEl.getBBox();
            let elX = parseFloat(state.selectedEl.getAttribute('x') || state.selectedEl.getAttribute('cx') || 0);
            let elY = parseFloat(state.selectedEl.getAttribute('y') || state.selectedEl.getAttribute('cy') || 0);
            state.dragOffsetX = pos.x - elX;
            state.dragOffsetY = pos.y - elY;
        } else {
            deselect();
        }
        return;
    }

    state.isDrawing = true;
    let newEl = null;

    const commonAttrs = {
        fill: inputs.fill.value,
        stroke: inputs.stroke.value,
        'stroke-width': inputs.width.value
    };

    switch (state.tool) {
        case 'rect':
        case 'square':
            newEl = document.createElementNS(SVG_NS, 'rect');
            newEl.setAttribute('x', pos.x);
            newEl.setAttribute('y', pos.y);
            newEl.setAttribute('width', 0);
            newEl.setAttribute('height', 0);
            break;
        case 'circle':
        case 'ellipse':
            newEl = document.createElementNS(SVG_NS, 'ellipse');
            newEl.setAttribute('cx', pos.x);
            newEl.setAttribute('cy', pos.y);
            newEl.setAttribute('rx', 0);
            newEl.setAttribute('ry', 0);
            break;
        case 'line':
            newEl = document.createElementNS(SVG_NS, 'line');
            newEl.setAttribute('x1', pos.x);
            newEl.setAttribute('y1', pos.y);
            newEl.setAttribute('x2', pos.x);
            newEl.setAttribute('y2', pos.y);
            break;
        case 'polygon':
        case 'star':
            newEl = document.createElementNS(SVG_NS, 'polygon');
            break;
    }

    if (newEl) {
        for (const [key, val] of Object.entries(commonAttrs)) {
            newEl.setAttribute(key, val);
        }
        newEl.id = `shape_${Date.now()}`;
        
        mainLayer.appendChild(newEl);
        state.selectedEl = newEl; 
    }
});

svgBoard.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    const currX = pos.x;
    const currY = pos.y;

    if (state.tool === 'select' && state.isDragging && state.selectedEl) {
        const newX = currX - state.dragOffsetX;
        const newY = currY - state.dragOffsetY;
        const tag = state.selectedEl.tagName;
        
        if (tag === 'rect' || tag === 'image') {
            state.selectedEl.setAttribute('x', newX);
            state.selectedEl.setAttribute('y', newY);
        } else if (tag === 'ellipse' || tag === 'circle') {
            state.selectedEl.setAttribute('cx', newX);
            state.selectedEl.setAttribute('cy', newY);
        } else if (tag === 'polygon' || tag === 'line') {
            state.selectedEl.setAttribute('transform', `translate(${newX}, ${newY})`); 
        }
        return;
    }

    if (!state.isDrawing || !state.selectedEl) return;

    const w = Math.abs(currX - state.startX);
    const h = Math.abs(currY - state.startY);
    const el = state.selectedEl;

    switch (state.tool) {
        case 'rect':
            el.setAttribute('width', w);
            el.setAttribute('height', h);
            el.setAttribute('x', Math.min(currX, state.startX));
            el.setAttribute('y', Math.min(currY, state.startY));
            break;
        case 'square':
            const side = Math.max(w, h); 
            el.setAttribute('width', side);
            el.setAttribute('height', side);
            el.setAttribute('x', currX < state.startX ? state.startX - side : state.startX);
            el.setAttribute('y', currY < state.startY ? state.startY - side : state.startY);
            break;
        case 'ellipse':
            el.setAttribute('rx', w);
            el.setAttribute('ry', h);
            break;
        case 'circle':
            const r = Math.sqrt(w*w + h*h); 
            el.setAttribute('rx', r);
            el.setAttribute('ry', r);
            break;
        case 'line':
            el.setAttribute('x2', currX);
            el.setAttribute('y2', currY);
            break;
        case 'polygon':
            updatePolygonPoints(el, state.startX, state.startY, currX, currY, parseInt(inputs.sides.value));
            break;
        case 'star':
            updateStarPoints(el, state.startX, state.startY, currX, currY, parseInt(inputs.sides.value));
            break;
    }
});

svgBoard.addEventListener('mouseup', () => {
    if (state.isDrawing) {
        addLayerItem(state.selectedEl, state.tool);
        selectShape(state.selectedEl); 
    }
    state.isDrawing = false;
    state.isDragging = false;
});

function updatePolygonPoints(el, cx, cy, mx, my, sides) {
    const radius = Math.sqrt((mx - cx)**2 + (my - cy)**2);
    let points = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI / sides) - (Math.PI / 2);
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    el.setAttribute('points', points.join(' '));
}

function updateStarPoints(el, cx, cy, mx, my, pointsCount) {
    const outerRadius = Math.sqrt((mx - cx)**2 + (my - cy)**2);
    const innerRadius = outerRadius / 2;
    let points = [];
    const totalPoints = pointsCount * 2; 
    for (let i = 0; i < totalPoints; i++) {
        const r = (i % 2 === 0) ? outerRadius : innerRadius;
        const angle = (i * Math.PI / pointsCount) - (Math.PI / 2);
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        points.push(`${x},${y}`);
    }
    el.setAttribute('points', points.join(' '));
}

function addLayerItem(el, typeName) {
    const li = document.createElement('li');
    li.textContent = `${typeName} ${layersList.children.length + 1}`;
    li.dataset.id = el.id;
    li.addEventListener('click', () => {
        const shape = document.getElementById(li.dataset.id);
        if (shape) selectShape(shape);
    });
    layersList.prepend(li);
}

function removeLayerItem(id) {
    const li = layersList.querySelector(`li[data-id="${id}"]`);
    if (li) li.remove();
}

function highlightLayer(id) {
    document.querySelectorAll('#layersList li').forEach(li => li.classList.remove('active-layer'));
    const activeLi = layersList.querySelector(`li[data-id="${id}"]`);
    if (activeLi) activeLi.classList.add('active-layer');
}

function selectShape(el) {
    state.selectedEl = el;
    document.querySelectorAll('.selected-shape').forEach(x => x.classList.remove('selected-shape'));
    el.classList.add('selected-shape');
    highlightLayer(el.id);
    
    inputs.fill.value = el.getAttribute('fill') || '#000000';
    inputs.stroke.value = el.getAttribute('stroke') || '#000000';
    inputs.width.value = el.getAttribute('stroke-width') || 1;
    document.getElementById('swVal').innerText = inputs.width.value;
    
    document.getElementById('geoControls').style.display = 'block';
    
    if (el.tagName === 'rect') {
        inputs.geoW.value = Math.round(el.getAttribute('width'));
        inputs.geoH.value = Math.round(el.getAttribute('height'));
    } else if (el.tagName === 'ellipse') {
        inputs.geoW.value = Math.round(el.getAttribute('rx'));
        inputs.geoH.value = Math.round(el.getAttribute('ry'));
    }
}

function deselect() {
    state.selectedEl = null;
    document.querySelectorAll('.selected-shape').forEach(x => x.classList.remove('selected-shape'));
    document.querySelectorAll('#layersList li').forEach(li => li.classList.remove('active-layer'));
    document.getElementById('geoControls').style.display = 'none';
}

function handleDelete() {
    if (state.selectedEl) {
        removeLayerItem(state.selectedEl.id);
        state.selectedEl.remove();
        deselect();
    }
}

inputs.fill.addEventListener('input', (e) => {
    if (state.selectedEl) state.selectedEl.setAttribute('fill', e.target.value);
});
inputs.stroke.addEventListener('input', (e) => {
    if (state.selectedEl) state.selectedEl.setAttribute('stroke', e.target.value);
});
inputs.width.addEventListener('input', (e) => {
    document.getElementById('swVal').innerText = e.target.value;
    if (state.selectedEl) state.selectedEl.setAttribute('stroke-width', e.target.value);
});
inputs.geoW.addEventListener('input', (e) => {
    if (!state.selectedEl) return;
    const val = e.target.value;
    if (state.selectedEl.tagName === 'rect') state.selectedEl.setAttribute('width', val);
    if (state.selectedEl.tagName === 'ellipse') state.selectedEl.setAttribute('rx', val);
});
inputs.geoH.addEventListener('input', (e) => {
    if (!state.selectedEl) return;
    const val = e.target.value;
    if (state.selectedEl.tagName === 'rect') state.selectedEl.setAttribute('height', val);
    if (state.selectedEl.tagName === 'ellipse') state.selectedEl.setAttribute('ry', val);
});

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const key = e.key;
    if (key === 'Delete' || key === 'Backspace') {
        handleDelete();
        return;
    }
    const targetBtn = document.querySelector(`.tool-btn[data-key="${key}"]`);
    if (targetBtn) targetBtn.click();
});


const urlParams = new URLSearchParams(window.location.search);
const currentDrawingId = urlParams.get('id');
let currentDrawingTitle = "Nuevo Dibujo";

async function loadDrawingIfExists() {
    if (!currentDrawingId) return;

    const rawToken = localStorage.getItem('vector_token');
    const token = (rawToken || '').replace(/^['"]+|['"]+$/g, '').trim();

    if (!token) { 
        window.location.href = 'index.html'; 
        return; 
    }

    try {
        const response = await fetch(`${CONFIG.API_URL}/drawings/${currentDrawingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error("Respuesta del servidor:", response.status);
            throw new Error("No se pudo cargar el dibujo");
        }

        const data = await response.json();
        console.log("Datos recibidos del backend:", data);

        currentDrawingTitle = data.title || data.Title || "Dibujo sin título";

        const titleSpan = document.querySelector('.navbar span');
        if (titleSpan) titleSpan.innerText = currentDrawingTitle;

        const svgRaw = data.svgContent || data.SvgContent;
        if (!svgRaw) throw new Error("El servidor no envió svgContent");

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgRaw, "image/svg+xml");

        if (!doc.documentElement) throw new Error("SVG inválido recibido del servidor");

        const newSvg = doc.documentElement;

        svgBoard.innerHTML = newSvg.innerHTML;

        bgLayer = document.getElementById('bgLayer');
        mainLayer = document.getElementById('mainLayer');

        if (!mainLayer) {
            console.error("Error: mainLayer no existe dentro del SVG cargado");
            throw new Error("El SVG no contiene mainLayer");
        }

        rebuildLayersList();

        console.log("Dibujo cargado correctamente y referencias re-conectadas.");

    } catch (error) {
        console.error("Error cargando el dibujo:", error);
        alert("Error cargando el dibujo: " + error.message);
    }
}

function rebuildLayersList() {
    layersList.innerHTML = '';
    if (!mainLayer) return;

    const shapes = Array.from(mainLayer.children);

    shapes.forEach(shape => {
        let type = shape.tagName;

        if (type === 'rect') {
            const w = shape.getAttribute('width');
            const h = shape.getAttribute('height');
            if (w === h) type = 'square';
        }

        addLayerItem(shape, type);
    });
}


document.getElementById('saveBtn').onclick = async () => {
    const rawToken = localStorage.getItem('vector_token');
    const token = (rawToken || '').replace(/^['"]+|['"]+$/g, '').trim();
    
    const svgContent = new XMLSerializer().serializeToString(svgBoard);
    
    if (!currentDrawingId) {
        const newTitle = prompt("Nombre del dibujo:", currentDrawingTitle);
        if (!newTitle) return;
        currentDrawingTitle = newTitle;
    }

    const payload = {
        Title: currentDrawingTitle,
        SvgContent: svgContent
    };

    let url = `${CONFIG.API_URL}/drawings`;
    let method = 'POST';

    if (currentDrawingId) {
        url = `${CONFIG.API_URL}/drawings/${currentDrawingId}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Error al guardar");

        if (method === 'POST') {
    const data = await response.json();
    console.log("Respuesta POST /drawings:", data);

    const newId = data.id || data.Id || data._id;

    if (!newId) {
        alert("¡Dibujo creado, pero el servidor no devolvió un id legible!");
        return;
    }

    alert("¡Dibujo creado!");
    window.location.search = `?id=${newId}`;
} else {
    alert("¡Cambios guardados!");
}


    } catch (error) {
        console.error(error);
        alert("Hubo un problema al guardar.");
    }
};

loadDrawingIfExists();