document.addEventListener('DOMContentLoaded', function() {
    const menuApplyButton = document.getElementById('menuApply');
    const wateringSelect = document.getElementById('watering');
    const thresholdTemperatureInput = document.getElementById('thresholdTemperature');
    const thresholdHumidityInput = document.getElementById('thresholdHumidity');
    const thresholdLightLevelInput = document.getElementById('thresholdLightLevel');

    const fetchPots = async () => {
        try {
            const response = await fetch('/api/userpots', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                renderPotsList(data.pots);
            } else {
                console.error('Failed to fetch pots:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching pots:', error.message);
        }
    };

    const renderPotsList = (pots) => {
        const potList = document.getElementById('potList');
        potList.innerHTML = '';
        pots.forEach((pot, index) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
        ${pot}
        <span class="badge bg-danger rounded-pill delete-pot" data-index="${index}" style="cursor: pointer;">X</span>
      `;
            potList.appendChild(li);
        });
    };

    document.getElementById('addPot').addEventListener('click', async () => {
        const potName = document.getElementById('potName').value.trim();
        if (!potName) return;

        try {
            const response = await fetch('/api/userpots/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ potName })
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    fetchPots();
                    document.getElementById('potName').value = '';
                } else {
                    alert('Pot already exists or failed to add pot.');
                }
            } else {
                console.error('Failed to add pot:', response.statusText);
            }
        } catch (error) {
            console.error('Error adding pot:', error.message);
        }
    });

    document.getElementById('potList').addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-pot')) {
            const index = event.target.dataset.index;
            let potName = event.target.parentNode.textContent.trim().split(' ')[0];
            if (!potName) return;
            potName = potName.replace(/\s+/g, ' ').trim();

            try {
                const response = await fetch('/api/userpots/delete', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ potName })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        fetchPots();
                    } else {
                        alert('Pot does not exist or failed to delete pot.');
                    }
                } else {
                    console.error('Failed to delete pot:', response.statusText);
                }
            } catch (error) {
                console.error('Error deleting pot:', error.message);
            }
        }
    });


    // initial
    fetchPots();
    //


    menuApplyButton.addEventListener('click', async function() {
        const watering = wateringSelect.value;
        const options = {
            watering: watering
        }
        const thresholds = {
            temperature: thresholdTemperatureInput.value,
            humidity: thresholdHumidityInput.value,
            lightLevel: thresholdLightLevelInput.value
        };

        try {
            const response = await fetch('/automation/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ options, thresholds })
            });

            if (!response.ok) {
                throw new Error('Something went wrong');
            }
            const data = await response.json();
            console.log('Response data:', data);
            alert("Successfully edited settings!");

            updateThresholds(thresholds);
        } catch (error) {
            console.error('Error:', error);
        }
    });

    document.getElementById("btn-menu").addEventListener('click',async function(){
        try {
            const response = await fetch('/automation/', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Something went wrong');
            }
            const data = await response.json();

            wateringSelect.value = data.options.watering;
            if (data.thresholds.temperature){
                thresholdTemperatureInput.value=data.thresholds.temperature;
            } else {
                thresholdTemperatureInput.value=0;
            }
            if (data.thresholds.humidity){
                thresholdHumidityInput.value=data.thresholds.humidity;
            } else {
                thresholdHumidityInput.value=0;
            }
            if (data.thresholds.lightLevel){
                thresholdLightLevelInput.value=data.thresholds.lightLevel;
            } else {
                thresholdLightLevelInput.value=0;
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });



    (async function() {
        try {
            const response = await fetch('/automation/', {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error('Something went wrong');
            }
            const data = await response.json();

            updateThresholds(data.thresholds);
        } catch (error) {
            console.error('Error:', error);
        }
    })();
});