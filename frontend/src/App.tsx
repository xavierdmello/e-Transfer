import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { usePrivyWagmi } from "@privy-io/wagmi-connector";
import { useNetwork, useSwitchNetwork, useTransaction } from "wagmi";
import { keccak256, encodeAbiParameters, parseAbiParameters, parseUnits, formatUnits } from "viem";
import { useContractRead, usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import React from "react";
import { ref, update, set, onValue, get } from "firebase/database";
import Header from "./components/Header.tsx";
import LandingPage from "./components/LandingPage.tsx";
import Wallet from "./components/Wallet.tsx";
import Settings from "./components/Settings.tsx";
import { hashEmail } from "./helperFunctions.ts";
import db from "./firebase.ts";
import {
  Button,
  Input,
  Heading,
  InputGroup,
  useToast,
  InputLeftElement,
  InputRightElement,
  Container,
  Center,
  Box,
  UnorderedList,
  Spinner,
  ListItem,
  NumberInput,
  NumberInputField,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  HStack,
  VStack,
  Grid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Select,
  Flex,
} from "@chakra-ui/react";

function App() {
  const [menu, setMenu] = useState("landing");
  const { login, authenticated, user, ready, createWallet } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    async function runEffect() {
      if (ready && authenticated) {
        if (user?.wallet) {
          // make sure wallet is on correct network
          const targetChainId = 420;
          const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === "privy")!;
          const currentChainId: number = parseInt(embeddedWallet.chainId);

          if (currentChainId !== targetChainId) {
            await embeddedWallet.switchChain(targetChainId);
          }
        } else {
          // In case embedded wallet creation bugged out when user first signed up.
          createWallet();
        }
      }
    }
    runEffect();
  }, [authenticated, ready, user]);

  function getBodyElement() {
    if (menu === "landing") {
      return <LandingPage />;
    } else if (menu === "wallet" || menu === "sendMoney" || menu === "receiveMoney") {
      return <Wallet setMenu={setMenu} menu={menu} />;
    } else if (menu === "settings") {
      return <Settings />;
    } else {
      return (
        <div>
          <h1>Error: Invalid Menu '{menu}'</h1>
        </div>
      );
    }
  }

  // Submit users info to firebase server
  useEffect(() => {
    if (ready && authenticated && user?.wallet) {
      const path = ref(db, "users/");
      const updates: { [key: string]: { email: string; address: string; name: string } } = {};
      const email = user?.email?.address!;
      const walletAddress = user?.wallet?.address!;

      // Check if the user's email and address already exist in the database
      get(ref(db, "users/" + hashEmail(email))).then((snapshot) => {
        if (!snapshot.exists() || !snapshot.child("name").exists() || !snapshot.child("address").exists()) {
          // If the data doesn't exist, update the database with the user's info
          const updates = {
            [hashEmail(email)]: { email: email, address: walletAddress, name: "John Doe" },
          };
          update(path, updates);
        }
      });
    }
  }, [ready, authenticated, user]);

  return (
    <Flex justifyContent={"center"} pt={["0", "10px"]} pb={["0", "10px"]} height={"100vh"} direction={"column"} backgroundColor={["brand.500", "#13482e"]}>
      <Center height={"100%"}>
        <Flex
          w={["100%", "60%"]}
          maxW={"500px"}
          shadow={"sm"}
          border={"5px solid"}
          borderColor={"brand.500"}
          borderRadius={["0", "3xl"]}
          height={"100%"}
          borderBottomRadius={["3xl", "0xl"]}
          padding={"0px"}
          backgroundColor={"brand.500"}
          direction={"column"}
        >
          <Flex className="baller" height={"100%"} direction={"column"}>
            <Header setMenu={setMenu} menu={menu} />
            {getBodyElement()}
          </Flex>
        </Flex>
      </Center>
    </Flex>
  );
}

export default App;
