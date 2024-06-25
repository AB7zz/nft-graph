import React from 'react'
import { ethers } from 'ethers'

const AuthContext = React.createContext()

export const provider = new ethers.providers.Web3Provider(window.ethereum)

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = React.useState(null)
    const [balance, setUserBalance] = React.useState(0)
    
    const connect = async() => {
        if (window.ethereum) {
            provider.send("eth_requestAccounts", []).then(async () => {
                await accountChangedHandler(provider.getSigner());
            })
        } else {
            console.log("Please Install Metamask!!!");
        }
    }

    const accountChangedHandler = async (newAccount) => {
        const address = await newAccount.getAddress();
        setAccount(address);
        const balance = await newAccount.getBalance()
        setUserBalance(ethers.utils.formatEther(balance));
        await getuserBalance(address)
    }
    
    const disconnect = () => {
        setAccount(null);
    }

    const getuserBalance = async (address) => {
        const balance = await provider.getBalance(address, "latest")
    }
    
    return (
        <AuthContext.Provider value={{ 
            account, 
            balance,
            connect, 
            disconnect 
        }}>
        {children}
        </AuthContext.Provider>
    )
}

export const useAuthContext = () => React.useContext(AuthContext)
