# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def clean(df):
    df.replace(r'\N', "UNKN", inplace=True)
    df.dropna(inplace=True)
    return df

base_path = './dataset/'
airlines = pd.read_csv(base_path+'airlines.csv')
airplanes = pd.read_csv(base_path+'airplanes.csv')
airport = pd.read_csv(base_path+'airports.csv')
routes = pd.read_csv(base_path+'routes.csv')
volcanoes = pd.read_csv(base_path+'volcanoes.csv')
airlines = clean(airlines)
airplanes = clean(airplanes)
airport = clean(airport)
routes = clean(routes)
#volcanoes = clean(volcanoes)

unique_ids = airlines['Name'].unique()
color_map = plt.get_cmap('gist_rainbow')
colors = [color_map(i) for i in range(len(unique_ids))]
hex_colors = [mcolors.to_hex(color) for color in colors]
color_dict = dict(zip(unique_ids, hex_colors))
airlines['colors'] = airlines['Name'].map(color_dict)

@app.route('/volcanoes')
def volcano():
    print("reached volcanoes")
    volc_data=[]
    for index, row in volcanoes.iterrows():
        try:
            id = row['id']
            country = row["Country"]
            vlong = row["Longitude"]
            vlat = row['Latitude']
            vmag = float(row['Elevation'])/500
        except Exception:
            continue
        volc_dict = {
        'index':id,
        'country': country,
        'lng': vlong,
        'lat': vlat,
        'vmag': vmag
        }
    
        volc_data.append(volc_dict)
    return jsonify(volc_data)

@app.route('/airports')
def airports():
    print("reached airports")
    airport_data=[]
    for index, row in airport.iterrows():
        try:
            id = row['Airport ID']
            name = row["Name"]
            code = row["IATA"]
            lat = row['Latitude']
            long = row['Longitude']
            city = row['City']
        except Exception:
            continue
        airport_dict = {
        'index':id,
        'name': name,
        'lat': lat,
        'lng': long,
        'code': code,
        'city': city
        }
    
        airport_data.append(airport_dict)
    return jsonify(airport_data)
            
@app.route('/airline')
def airline():
    print("reached airlines")
    airline_data=[]
    for index, row in airlines.iterrows():
        try:
            id = row['Airline ID']
            name = row["Name"]
        except Exception:
            continue
        airline_dict = {
        'index':id,
        'name': name
        }
    
        airline_data.append(airline_dict)
    return jsonify(airline_data)
 
@app.route('/flight-data')
def flight_data():
    print('reached flight data')
    airport_id = request.args.get('airportId')
    flight_data = []
    filtered_routes = routes[routes['Source airport ID'] == airport_id]
    c=0
    for index, row in filtered_routes.iterrows():
        try:
            source_id = int(row['Source airport ID'])
            destination_id = int(row['Destination airport ID'])

            flight_time = float(row['Flight time (hrs)'])
            fuel_consumption = float(row['Fuel Consumption (l/km)'])

            sairport_row = airport.loc[airport['Airport ID'] == source_id]
            scode = row['Source airport']
            startlat = sairport_row["Latitude"].iloc[0]
            startlong = sairport_row["Longitude"].iloc[0]
            scity = sairport_row["City"].iloc[0]
        
            dairport_row = airport.loc[airport['Airport ID'] == destination_id]
            dcode = row['Destination airport']
            endlat = dairport_row["Latitude"].iloc[0]
            endlong = dairport_row["Longitude"].iloc[0]
            dcity = dairport_row["City"].iloc[0]
            
            airline_row = airlines.loc[airlines['Airline ID'] == int(row['Airline ID'])]
            acode = airline_row['IATA'].iloc[0]
            airline = airline_row['Name'].iloc[0]
            col = airline_row['colors'].iloc[0]
            
            aircraft_code = row['Equipment']
            aircraft_code = aircraft_code.split(' ')
            aircrafts = []

            for i in aircraft_code:
                a = airplanes.loc[airplanes['IATA code'] == i]
                airp = a['Name'].iloc[0]
                aircrafts.append(airp)
            airplane = ', '.join(aircrafts)


            airport_dict = {
                'index':index,
                'airline': airline,
                'acode': acode,
                'airplane': airplane,
                'startLat': startlat,
                'startLng': startlong,
                'scode': scode,
                'scity': scity,
                'endLat': endlat,
                'endLng': endlong,
                'dcode': dcode,
                'dcity': dcity,
                'fueltime' : fuel_consumption,
                'flighttime': flight_time,
                'color': [col,'#000000']
            }
            flight_data.append(airport_dict)
        except Exception as e:
            c+=1
            continue
    print(f'Skipped {c} invalid Flights')
    return jsonify(flight_data)

@app.route('/volc-data')
def volc_data():
    print('reached Volc data')
    volc_id = request.args.get('volcId')
    volc_id = int(volc_id)
    volca_data = []
    filtered_volc = volcanoes[volcanoes['id'] == volc_id]
    c=0
    for index, row in filtered_volc.iterrows():
        try:
            volc_dict = {
                'year': row['Year'],
                'month': row['Month'],
                'day': row['Day'],
                'name': row['Name'],
                'location': row['Location'],
                'country': row['Country'],
                'latitude': row['Latitude'],
                'longitude': row['Longitude'],
                'elevation': row['Elevation'],
                'type': row['Type'],
                'status': row['Status']
            }
            volca_data.append(volc_dict)
        except Exception as e:
            c+=1
            continue
    print(f'Skipped {c} invalid Volcanoes')
    return jsonify(volca_data[0])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Use Render's assigned port
    app.run(host="0.0.0.0", port=port)
