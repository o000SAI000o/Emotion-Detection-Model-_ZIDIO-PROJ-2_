import React, { useState } from "react";
import axios from "axios";

const CreateIpo = () => {
    const [formData, setFormData] = useState({
        company_id: "",
        api_source_id: "",
        price_per_share: "",
        total_shares: "",
        opening_date: "",
        closing_date: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/api/ipo", formData);
            alert(response.data.message);
        } catch (error) {
            console.error("Error creating IPO:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="company_id" placeholder="Company ID" onChange={handleChange} required />
            <input type="text" name="api_source_id" placeholder="API Source ID" onChange={handleChange} required />
            <input type="number" name="price_per_share" placeholder="Price per Share" onChange={handleChange} required />
            <input type="number" name="total_shares" placeholder="Total Shares" onChange={handleChange} required />
            <input type="date" name="opening_date" onChange={handleChange} required />
            <input type="date" name="closing_date" onChange={handleChange} required />
            <button type="submit">Create IPO</button>
        </form>
    );
};

export default CreateIpo;
