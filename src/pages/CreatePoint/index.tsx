import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import './style.css';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import {LeafletMouseEvent} from 'leaflet';
import api from '../../services/api';
import logo from '../../assets/logo.svg'
import axios from 'axios';

//Sempre que a gete cria um estado para un array ou objeto precisamos manualmente informar o tipo da variavel que vai ser armazenada ali dentro
interface Item {
    id: number;
    title: string;
    image: string;
}

interface Ufs {    
    sigla: string;
    nome: string;
}

interface Cities {
    id: number;
    nome: string;
}

const CreatePoint = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<Ufs[]>([]);
    const [selectedUf,setSelectedUf] = useState('0');
    const [selectedCity,setSelectedCity] = useState('0');
    const [cities, setCities] = useState<Cities[]>([]);
    const [selectedItems, setSelectedItems] = useState<Cities[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number,number]>([-25.5519754,-49.2537338]);
    const [initialPosition, setInitialPosition] = useState<[number,number]>([-25.5519754,-49.2537338]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });
    const history = useHistory();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const {latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
            setSelectedPosition(initialPosition);
        });
    });

    useEffect(() => {
        api.get('http://192.168.15.8:5000/api/items').then(response => {
            console.log(response);
            setItems(response.data)
        });
    }, []);

    useEffect(() => {
        axios.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {            
            setUfs(response.data);
        });
    }, []);
    useEffect(() => {        //carregar as cidades sempre que mudar a UF
        if(selectedUf === 0){
            return;
        }
        axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {            
            setCities(response.data);
        });
    }, [selectedUf]);    

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        let uf = event.target.value;
        setSelectedUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        let city = event.target.value;
        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);        
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>){
        let {name, value} =  event.target;
        setFormData({ ...formData, [name]: value });            
    }

    function handleSelectItem(id){        
        const alreadySelected = selectedItems.findIndex(x => x === id);
        if(alreadySelected > -1){
            const filteredItems = selectedItems.filter(x => x !== id);
            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([...selectedItems, id ]);
        }
    }

    async function handleSubmit(event: FormEvent){        
        event.preventDefault();

        const {name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            uf,
            city,
            latitude,
            longitude,
            items
        };
        
        await api.post('points', data);

        alert("Sucesso");

        history.push('/');

    }

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta" />
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para Home
                </Link>
            </header>
            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br /> Ponto de Coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input type="text" name="name" id="name" onChange={handleInputChange}/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange}/>
                        </div>

                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange}/>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={selectedPosition}></Marker>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                            <option value="0">Selecione um Estado</option>
                                {ufs.map(uf => (
                                    <option key={uf.sigla} value={uf.sigla}>{uf.nome}</option>
                                ))}                                
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma Cidade</option>
                                {cities.map(city => (
                                    <option key={city.id} value={city.nome}>{city.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de Coleta</h2>
                        <span>Selecione um ou mais items abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li className={selectedItems.includes(item.id)? 'selected' : ''} id={item.id} key={item.id} onClick={() => handleSelectItem(item.id)}>
                                <img src={item.image} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}

                    </ul>
                </fieldset>

                <button type="submit"> Cadastrar Ponto de Coleta</button>
            </form>
        </div>

    );

}

export default CreatePoint;