const localhost = `https://viewer-web-app.maestrotest.info`;
const socket = io(localhost);
import { initViewer, loadModel } from './viewer.js';

function afterViewerEvents(viewer, events) {
    let promises = [];
    events.forEach(function (event) {
        promises.push(new Promise(function (resolve, reject) {
            let handler = function () {
                viewer.removeEventListener(event, handler);
                console.log(`Removed event listener for ${event}`)
                resolve();
            }
            viewer.addEventListener(event, handler);
            console.log(`Added event listener for ${event}`)
        }));
    });

    return Promise.all(promises)
}

const viewerPromise = initViewer(document.getElementById('preview')).then(async viewer => {
    const urn = window.location.hash?.substring(1);
    const params = new URLSearchParams(window.location.search);
    console.log('Params on init viewer', params)
    const paramValue = params.get('param');
    console.log('Param on the viewer initialization: ', paramValue);
    await setupModelSelection(viewer);
    if (paramValue) {await QRIDs(viewer, paramValue)}
    return viewer;
});

socket.on('assemblyID event', function (data) {
    console.log('Event emitter data :', data);
    selectAssemblyID(viewerPromise, data);
});

async function selectAssemblyID(viewerPromise, data) { // This all can be redone with viewer.search() method to decrease complexity
    viewerPromise.then(async viewer => {
        if (viewer.model.isObjectTreeCreated()){
        } else {
            await afterViewerEvents(viewer, [
                Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT
            ]);
        }
        console.log("Model from selectAssemblyID", viewer.model)
        console.log("Viewer from selectAssemblyID", viewer)
        let idDict = await new Promise(resolve => {
            viewer.model.getExternalIdMapping(data => resolve(data));
        }); 
        console.log('ID Dict from main.js:', idDict);
        console.log('data from main.js:', data);
        let assemblyIDs = [] 
        data.UniqueIDsArray.forEach(id => {
            console.log('id:', id);
            let dbId = idDict[id];
            assemblyIDs.push(dbId);
        });
        viewer.select(assemblyIDs);
        viewer.fitToView(assemblyIDs);
    });
}
async function QRIDs(viewer, data) {
    try {
        await new Promise((resolve) => { // here we wait for the model to be loaded
            if (viewer.model) {
                resolve();
            } else {
                viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, function handler() {
                    viewer.removeEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, handler);
                    resolve();
                });
            }
        });

        if (viewer.model.isObjectTreeCreated()){
            // Do nothing
        } else {
            await afterViewerEvents(viewer, [
                Autodesk.Viewing.OBJECT_TREE_CREATED_EVENT // here we wait for the object tree to be created
            ]);
        }

        viewer.search(data, function(dbIDs) {
            viewer.select(dbIDs);
            viewer.fitToView(dbIDs);
            console.log(dbIDs);
        });
    } catch (err) {
        console.error(err);
    }
}

async function setupModelSelection(viewer) {
    try {
        const resp = await fetch('/api/models');
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const models = await resp.json();
        let nameToFind = "test.rvt"; // hard coded for now
        let foundModel = models.find(model => model.name === nameToFind);
        console.log(models);
        /* dropdown.innerHTML = models.map(model => `<option value=${model.urn} ${model.urn === selectedUrn ? 'selected' : ''}>${model.name}</option>`).join('\n');
        dropdown.onchange = () => onModelSelected(viewer, dropdown.value); */
        if (foundModel) {
            onModelSelected(viewer, foundModel.urn);
        }
    } catch (err) {
        alert('Could not list models. See the console for more details.');
        console.error(err);
    }
}

async function onModelSelected(viewer, urn) {
    if (window.onModelSelectedTimeout) {
        clearTimeout(window.onModelSelectedTimeout);
        delete window.onModelSelectedTimeout;
    }
    window.location.hash = urn;
    try {
        const resp = await fetch(`/api/models/${urn}/status`);
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const status = await resp.json();
        switch (status.status) {
            case 'n/a':
                showNotification(`Model has not been translated.`);
                break;
            case 'inprogress':
                showNotification(`Model is being translated (${status.progress})...`);
                window.onModelSelectedTimeout = setTimeout(onModelSelected, 5000, viewer, urn);
                break;
            case 'failed':
                showNotification(`Translation failed. <ul>${status.messages.map(msg => `<li>${JSON.stringify(msg)}</li>`).join('')}</ul>`);
                break;
            default:
                clearNotification();
                loadModel(viewer, urn);
                break; 
        }
    } catch (err) {
        alert('Could not load model. See the console for more details.');
        console.error(err);
    }
}

function showNotification(message) {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = `<div class="notification">${message}</div>`;
    overlay.style.display = 'flex';
}

function clearNotification() {
    const overlay = document.getElementById('overlay');
    overlay.innerHTML = '';
    overlay.style.display = 'none';
}

export {viewerPromise};