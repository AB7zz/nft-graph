import React from 'react'
import { useStateContext } from '../../context/StateContext'

const Form = () => {
  const { insertToIPFS, createNFT } = useStateContext()
  const [formData, setFormData] = React.useState({
    file: null,
    name: '',
    description: '',
    price: 0,
  });

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'file' ? files[0] : value,
    }));
  };

  const handleSubmit = async(event) => {
    event.preventDefault();
    console.log(formData);

    const CID = await insertToIPFS(formData)

    await createNFT(CID, formData.price * (10 ** 18))
  };
  return (
    <div className='flex flex-col w-screen'>
      <input
        type="file"
        className='p-5 m-auto w-[50%] border-2 my-3'
        name="file"
        onChange={handleChange}
      />
      <input
        type="text"
        placeholder='Name'
        className='p-5 m-auto w-[50%] border-2 my-3'
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
      <input
        type="text"
        placeholder='Description'
        className='p-5 m-auto w-[50%] border-2 my-3'
        name="description"
        value={formData.description}
        onChange={handleChange}
      />
      <input
        type="number"
        placeholder='Price in ETH'
        className='p-5 m-auto w-[50%] border-2 my-3'
        name="price"
        value={formData.price}
        onChange={handleChange}
      />
      <button className='bg-blue-500 text-white px-4 py-2 mt-5 rounded w-[50%] m-auto' onClick={handleSubmit}>
        Mint & List NFT
      </button>
    </div>
  )
}

export default Form